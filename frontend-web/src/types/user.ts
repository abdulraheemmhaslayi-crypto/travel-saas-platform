import { UserType, Role, KycStatus } from './auth';

export interface UserProfile {
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
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  language: string;
  currency: string;
  timezone: string;
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  bookingAlerts: boolean;
  paymentAlerts: boolean;
  tripUpdates: boolean;
  promotionalEmails: boolean;
  supportReplies: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface KycSubmission {
  documentType: string;
  documentNumber: string;
  documentImage?: string;
  addressProof?: string;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImage?: string;
  preferences?: Partial<UserPreferences>;
}

export interface AdminUserFilters {
  role?: Role;
  userType?: UserType;
  kycStatus?: KycStatus;
  isSuspended?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface NotificationResponse {
  id: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationPreferencesDto {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  bookingAlerts: boolean;
  paymentAlerts: boolean;
  tripUpdates: boolean;
  promotionalEmails: boolean;
  supportReplies: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}