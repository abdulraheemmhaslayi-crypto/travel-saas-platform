'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { PaymentProvider } from '@/types/payment';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY || '');

interface PaymentFormProps {
  amount: number;
  currency?: string;
  bookingId?: string;
  paymentType?: 'booking' | 'wallet_topup';
  provider: PaymentProvider;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const StripePaymentForm: React.FC<Omit<PaymentFormProps, 'provider'>> = ({
  amount,
  currency = 'INR',
  bookingId,
  paymentType = 'booking',
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useAppStore();

  const formatAmount = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
    }).format(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.createStripeIntent({
        amount,
        currency,
        bookingId,
        paymentType,
      });

      const { clientSecret } = response.data;

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (error) {
        onError?.(error.message || 'Payment failed');
        showToast(error.message || 'Payment failed', 'error');
      } else if (paymentIntent?.status === 'succeeded') {
        showToast('Payment successful!', 'success');
        onSuccess?.();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      onError?.(message);
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-300 rounded-md">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      <Button
        type="submit"
        isLoading={isLoading}
        disabled={!stripe}
        className="w-full"
      >
        Pay {formatAmount(amount)}
      </Button>
    </form>
  );
};

const RazorpayPaymentForm: React.FC<Omit<PaymentFormProps, 'provider'>> = ({
  amount,
  currency = 'INR',
  bookingId,
  paymentType = 'booking',
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useAppStore();

  const handlePayment = async () => {
    setIsLoading(true);

    try {
      const response = await apiClient.createRazorpayOrder({
        amount,
        currency,
        bookingId,
        paymentType,
      });

      const { orderId, keyId } = response.data;

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK is not available.');
      }

      const options = {
        key: keyId,
        amount: Math.round(amount * 100),
        currency,
        name: 'TravelFlow',
        description: 'Trip Booking',
        order_id: orderId,
        handler: async (response: Record<string, string>) => {
          try {
            await apiClient.verifyRazorpayPayment({
              orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            showToast('Payment successful!', 'success');
            onSuccess?.();
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Verification failed';
            onError?.(message);
            showToast(message, 'error');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#3b82f6',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment initialization failed';
      onError?.(message);
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center p-6 bg-gray-50 rounded-lg">
        <p className="text-2xl font-bold text-gray-900">
          {new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency,
          }).format(amount)}
        </p>
        <p className="text-sm text-gray-500 mt-1">Total amount to pay</p>
      </div>
      <Button
        onClick={handlePayment}
        isLoading={isLoading}
        className="w-full"
      >
        Pay with Razorpay
      </Button>
    </div>
  );
};

const WalletPaymentForm: React.FC<Omit<PaymentFormProps, 'provider'>> = ({
  amount,
  bookingId,
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const { showToast } = useAppStore();

  useEffect(() => {
    apiClient.getWallet()
      .then((res) => setWallet(res.data))
      .catch(() => showToast('Failed to check wallet balance', 'error'));
  }, [showToast]);

  const handleWalletPay = async () => {
    if (!bookingId) {
      showToast('Booking ID is missing', 'error');
      return;
    }
    if (!wallet || Number(wallet.balance) < amount) {
      showToast('Insufficient wallet balance', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.payWithWallet(bookingId);
      showToast('Payment successful using wallet!', 'success');
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wallet payment failed';
      onError?.(message);
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
          <span>Wallet Balance</span>
          <span className={wallet && Number(wallet.balance) >= amount ? 'text-green-600' : 'text-red-600'}>
            {wallet ? `₹${Number(wallet.balance).toFixed(2)}` : 'Loading...'}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
          <span>Amount to Pay</span>
          <span className="text-gray-950 font-bold">₹{amount.toFixed(2)}</span>
        </div>
      </div>
      <Button
        onClick={handleWalletPay}
        isLoading={isLoading}
        disabled={!wallet || Number(wallet.balance) < amount}
        className="w-full"
      >
        Confirm Wallet Payment
      </Button>
    </div>
  );
};

declare global {
  interface Window {
    Razorpay?: new (options: any) => { open: () => void };
  }
}

import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  const { paymentType = 'booking' } = props;
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>(props.provider || 'RAZORPAY');

  return (
    <Card className="max-w-md mx-auto">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Complete Payment
        </h2>

        {/* Tab selection */}
        <div className="flex border-b border-gray-200 mb-6 space-x-4">
          <button
            type="button"
            onClick={() => setSelectedProvider('RAZORPAY')}
            className={cn(
              'pb-2 text-sm font-semibold border-b-2 transition-all',
              selectedProvider === 'RAZORPAY'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            )}
          >
            UPI/Bank (Razorpay)
          </button>
          <button
            type="button"
            onClick={() => setSelectedProvider('STRIPE')}
            className={cn(
              'pb-2 text-sm font-semibold border-b-2 transition-all',
              selectedProvider === 'STRIPE'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            )}
          >
            Card (Stripe)
          </button>
          {paymentType === 'booking' && props.bookingId && (
            <button
              type="button"
              onClick={() => setSelectedProvider('WALLET')}
              className={cn(
                'pb-2 text-sm font-semibold border-b-2 transition-all',
                selectedProvider === 'WALLET'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              )}
            >
              Wallet
            </button>
          )}
        </div>

        {selectedProvider === 'STRIPE' ? (
          <Elements stripe={stripePromise}>
            <StripePaymentForm {...props} />
          </Elements>
        ) : selectedProvider === 'RAZORPAY' ? (
          <RazorpayPaymentForm {...props} />
        ) : selectedProvider === 'WALLET' ? (
          <WalletPaymentForm {...props} />
        ) : (
          <p className="text-red-600">Unsupported payment provider</p>
        )}
      </div>
    </Card>
  );
};

export default PaymentForm;