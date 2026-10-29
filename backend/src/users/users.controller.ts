import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../database/entities/role.entity';
import {
  UpdateProfileDto,
  UpdateUserDto,
  CreateUserDto,
  UserQueryDto,
  KycSubmissionDto,
  KycVerificationDto,
} from './dto/user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('me/kyc')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit KYC documents' })
  async submitKyc(
    @CurrentUser('id') userId: string,
    @Body() kycDto: KycSubmissionDto,
  ) {
    return this.usersService.submitKyc(userId, kycDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'userType', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query() query: UserQueryDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.findAll(query, currentUser);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.findById(id, currentUser);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create user' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.create(createUserDto, currentUser);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'Update user (Admin only)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.update(id, updateUserDto, currentUser);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Patch(':id/kyc')
  @ApiOperation({ summary: 'Verify/Reject KYC (Admin only)' })
  async verifyKyc(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() kycDto: KycVerificationDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.usersService.verifyKyc(id, kycDto, adminId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspend/Activate user' })
  async suspendUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.suspendUser(id, reason, currentUser);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.remove(id, currentUser);
  }
}