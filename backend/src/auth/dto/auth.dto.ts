import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '../../database/entities/user.entity';
import { RoleName } from '../../database/entities/role.entity';

export class RegisterDto {
  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+919876543210', description: 'Phone number with country code' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'Phone must be in international format (e.g., +919876543210)' })
  phone: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Password (min 8 chars, 1 uppercase, 1 number)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiProperty({ enum: UserType, example: UserType.PASSENGER, description: 'User type/role' })
  @IsEnum(UserType)
  userType: UserType;

  @ApiPropertyOptional({ enum: RoleName, description: 'Optional specific role name (for admin creation)' })
  @IsOptional()
  @IsEnum(RoleName)
  roleName?: RoleName;

  @ApiPropertyOptional({ example: '192.168.1.1', description: 'IP address', required: false })
  @IsOptional()
  @IsString()
  ip?: string;
}

export class LoginDto {
  @ApiPropertyOptional({ example: 'john.doe@example.com', description: 'Email address', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Phone number', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ example: '192.168.1.1', description: 'IP address', required: false })
  @IsOptional()
  @IsString()
  ip?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+919876543210', description: 'Phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123456', description: 'OTP code' })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(8)
  otp: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: '+919876543210', description: 'Phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'Refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'Reset token from email' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NewSecurePass123!', description: 'New password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPass123!', description: 'Current password' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewSecurePass123!', description: 'New password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;
}

export class SocialLoginDto {
  @ApiProperty({ example: 'google', description: 'Social provider' })
  @IsIn(['google', 'facebook', 'apple'])
  provider: string;

  @ApiProperty({ example: 'ya29.a0AfH6SMB...', description: 'Access token from provider' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email from social profile' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'John', description: 'First name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'https://...', description: 'Profile image URL' })
  @IsOptional()
  @IsString()
  profileImage?: string;
}