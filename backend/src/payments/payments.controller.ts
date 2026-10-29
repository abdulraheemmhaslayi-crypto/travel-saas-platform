import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Headers,
  RawBody,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { RazorpayService } from './razorpay.service';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../database/entities/role.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreatePaymentDto,
  WalletTopupDto,
  WalletWithdrawDto,
  PaymentQueryDto,
} from './dto/payment.dto';
import { PaymentMethod, PaymentType } from '../database/entities/payment.entity';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
    private readonly razorpayService: RazorpayService,
    private readonly walletService: WalletService,
  ) {}

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a payment' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(userId, createPaymentDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('stripe/intent')
  @ApiOperation({ summary: 'Create Stripe payment intent' })
  async createStripeIntent(
    @CurrentUser('id') userId: string,
    @Body() body: { amount: number; bookingId?: string; paymentType?: PaymentType },
  ) {
    return this.stripeService.createPaymentIntent(userId, body.amount, body.bookingId, body.paymentType);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('razorpay/order')
  @ApiOperation({ summary: 'Create Razorpay order' })
  async createRazorpayOrder(
    @CurrentUser('id') userId: string,
    @Body() body: { amount: number; bookingId?: string; paymentType?: PaymentType },
  ) {
    return this.razorpayService.createOrder(userId, body.amount, body.bookingId, body.paymentType);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('razorpay/verify')
  @ApiOperation({ summary: 'Verify Razorpay payment signature' })
  async verifyRazorpayPayment(
    @CurrentUser('id') userId: string,
    @Body() body: { paymentId: string; orderId: string; signature: string },
  ) {
    const isValid = await this.razorpayService.verifyPayment(
      body.paymentId,
      body.orderId,
      body.signature,
    );
    return { valid: isValid };
  }

  @Post('stripe/webhook')
  @ApiOperation({ summary: 'Stripe webhook' })
  async stripeWebhook(
    @Headers('stripe-signature') signature: string,
    @RawBody() rawBody: Buffer,
  ) {
    return this.stripeService.handleWebhook(signature, rawBody);
  }

  @Post('razorpay/webhook')
  @ApiOperation({ summary: 'Razorpay webhook' })
  async razorpayWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @RawBody() rawBody: Buffer,
  ) {
    return this.razorpayService.handleWebhook(signature, rawBody);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('wallet')
  @ApiOperation({ summary: 'Get wallet balance' })
  async getWallet(@CurrentUser('id') userId: string) {
    return this.walletService.getWallet(userId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('wallet/topup/initiate')
  @ApiOperation({ summary: 'Initiate wallet topup' })
  async initiateWalletTopup(
    @CurrentUser('id') userId: string,
    @Body() body: { amount: number; method: PaymentMethod },
  ) {
    if (body.method === PaymentMethod.STRIPE) {
      return this.stripeService.createPaymentIntent(
        userId,
        body.amount,
        undefined,
        PaymentType.WALLET_TOPUP,
      );
    } else if (body.method === PaymentMethod.RAZORPAY) {
      return this.razorpayService.createOrder(
        userId,
        body.amount,
        undefined,
        PaymentType.WALLET_TOPUP,
      );
    } else {
      throw new BadRequestException('Unsupported payment method for wallet topup');
    }
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('wallet/withdraw')
  @ApiOperation({ summary: 'Withdraw from wallet' })
  async withdrawWallet(
    @CurrentUser('id') userId: string,
    @Body() withdrawDto: WalletWithdrawDto,
  ) {
    return this.walletService.withdraw(userId, withdrawDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('wallet/transactions')
  @ApiOperation({ summary: 'Get wallet transactions' })
  async getTransactions(
    @CurrentUser('id') userId: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    return this.walletService.getTransactions(userId, query);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('my-payments')
  @ApiOperation({ summary: 'Get my payments' })
  async getMyPayments(
    @CurrentUser('id') userId: string,
    @Query() query: PaymentQueryDto,
  ) {
    return this.paymentsService.findByUser(userId, query);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.paymentsService.findById(id, userId, userRole);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post('refund')
  @ApiOperation({ summary: 'Refund a completed payment (Admin only)' })
  async refundPayment(
    @Body() body: { paymentId: string; amount: number; reason: string },
  ) {
    return this.paymentsService.processRefund(body.paymentId, body.amount, body.reason);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('refund/history')
  @ApiOperation({ summary: 'Get refund history' })
  async getRefundHistory(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Query() query: { page?: number; limit?: number; status?: string },
  ) {
    return this.paymentsService.getRefundHistory(userId, userRole, query);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('wallet/pay')
  @ApiOperation({ summary: 'Pay for a booking using wallet' })
  async payWithWallet(
    @CurrentUser('id') userId: string,
    @Body() body: { bookingId: string },
  ) {
    return this.walletService.payBooking(userId, body.bookingId);
  }
}