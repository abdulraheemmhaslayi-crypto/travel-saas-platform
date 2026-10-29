export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  role: Role;
  profileImage?: string;
  isVerified: boolean;
  isSuspended: boolean;
  kycStatus: KycStatus;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  emergencyContactPhone?: string;
  emergencyContactName?: string;
  kycDocumentType?: string;
  kycDocumentNumber?: string;
  kycSubmittedAt?: string;
  kycVerifiedAt?: string;
  kycRejectionReason?: string;
  preferredLanguage?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserType = 'PASSENGER' | 'DRIVER' | 'FLEET_OWNER' | 'SUPPORT' | 'ADMIN' | 'SUPER_ADMIN';
export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type KycStatus = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterDto {
  email: string;
  phone: string;
  password: string;
  userType: UserType;
  firstName: string;
  lastName: string;
}

export interface LoginDto {
  email?: string;
  phone?: string;
  password: string;
  ip?: string;
}

export interface VerifyOtpDto {
  phone: string;
  otp: string;
}

export interface ResendOtpDto {
  phone: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface SocialLoginDto {
  provider: string;
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
}