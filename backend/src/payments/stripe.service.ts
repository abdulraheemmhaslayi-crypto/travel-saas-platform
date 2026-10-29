import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod, PaymentType } from '../database/entities/payment.entity';
import { PaymentsService } from './payments.service';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
  ) {
    this.stripe = new Stripe(this.configService.get('stripe.secretKey'), {
      apiVersion: '2023-10-16',
    });
  }

  async createPaymentIntent(
    userId: string,
    amount: number,
    bookingId?: string,
    paymentType: PaymentType = PaymentType.BOOKING,
  ) {
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountInCents,
      currency: this.configService.get('stripe.currency', 'inr'),
      metadata: {
        userId,
        bookingId: bookingId || '',
        paymentType,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create payment record
    const payment = await this.paymentsService.create(
      userId,
      {
        bookingId,
        amount,
        method: PaymentMethod.STRIPE,
        currency: 'INR',
      },
      paymentType,
    );

    await this.paymentRepository.update(payment.id, {
      stripePaymentIntentId: paymentIntent.id,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
    };
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    if (!rawBody) {
      throw new BadRequestException('Raw request body is empty');
    }
    const webhookSecret = this.configService.get('stripe.webhookSecret');
    
    let event: Stripe.Event;
    
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentSuccess(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentFailure(failedPayment);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (payment) {
      await this.paymentsService.updatePaymentStatus(
        payment.id,
        PaymentStatus.COMPLETED,
        paymentIntent,
      );
    }
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (payment) {
      await this.paymentsService.updatePaymentStatus(
        payment.id,
        PaymentStatus.FAILED,
        paymentIntent,
      );
    }
  }

  async createRefund(paymentIntentId: string, amount?: number) {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    return refund;
  }
}