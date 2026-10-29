import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.email || data.phone, {
  message: 'Either email or phone is required',
  path: ['email'],
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in international format (e.g., +919876543210)'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  // Only allow publicly-registerable user types
  userType: z.enum(['PASSENGER', 'DRIVER', 'FLEET_OWNER']),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const profileUpdateSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  profileImage: z.string().optional().nullable(),
});

export const bookingSchema = z.object({
  tripId: z.string().uuid('Invalid trip ID'),
  seats: z.number().min(1, 'At least 1 seat is required').max(10, 'Maximum 10 seats allowed'),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  specialRequests: z.string().max(500, 'Special requests must be less than 500 characters').optional(),
});

export const searchTripSchema = z.object({
  origin: z.string().min(2, 'Origin is required').optional(),
  destination: z.string().min(2, 'Destination is required').optional(),
  date: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  vehicleType: z.string().optional(),
});

export const paymentIntentSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  bookingId: z.string().uuid().optional(),
  currency: z.string().default('INR'),
});

export const kycSchema = z.object({
  documentType: z.string().min(1, 'Document type is required'),
  documentNumber: z.string().min(1, 'Document number is required'),
  documentFront: z.string().min(1, 'Front document image is required'),
  documentBack: z.string().min(1, 'Back document image is required'),
  selfie: z.string().min(1, 'Selfie image is required'),
});

export const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  bookingAlerts: z.boolean(),
  paymentAlerts: z.boolean(),
  tripUpdates: z.boolean(),
  promotionalEmails: z.boolean(),
  supportReplies: z.boolean(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
export type SearchTripFormData = z.infer<typeof searchTripSchema>;
export type PaymentIntentFormData = z.infer<typeof paymentIntentSchema>;
export type KycFormData = z.infer<typeof kycSchema>;
export type NotificationPreferencesFormData = z.infer<typeof notificationPreferencesSchema>;