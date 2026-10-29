export interface Payment {
  id: string;
  bookingId?: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  providerPaymentId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PROCESSING'
  | 'REFUND_PENDING'
  | 'REFUND_COMPLETED';
export type PaymentProvider = 'STRIPE' | 'RAZORPAY' | 'WALLET';

export interface StripePaymentIntent {
  clientSecret: string;
  paymentId: string;
}

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  paymentId: string;
}

export interface Wallet {
  id: string;
  userId?: string;
  balance: number;
  currency: string;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  walletId?: string;
  type: TransactionType;
  amount: number;
  currency: string;
  description?: string;
  referenceId?: string;
  status: TransactionStatus;
  createdAt: string;
}

export type TransactionType = 'CREDIT' | 'DEBIT';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface CreatePaymentIntentDto {
  amount: number;
  bookingId?: string;
  currency?: string;
}

export interface VerifyPaymentDto {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface WalletTopUpDto {
  amount: number;
}