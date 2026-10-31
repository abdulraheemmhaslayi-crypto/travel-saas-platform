'use client';

import React, { useState, useEffect } from 'react';
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
import { cn } from '@/lib/utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY || '');

interface PaymentFormProps {
  amount: number | string;
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
  const numericAmount = Number(amount) || 0;
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
        amount: numericAmount,
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
        Pay {formatAmount(numericAmount)}
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
  const numericAmount = Number(amount) || 0;
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useAppStore();

  // Load Razorpay checkout script dynamically if missing
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePayment = async () => {
    setIsLoading(true);

    try {
      const response = await apiClient.createRazorpayOrder({
        amount: numericAmount,
        currency,
        bookingId,
        paymentType,
      });

      const { orderId, keyId } = response.data;

      // Handle mock / simulated orders in development mode
      if (orderId && orderId.startsWith('order_mock_')) {
        try {
          await apiClient.verifyRazorpayPayment({
            orderId,
            paymentId: `pay_mock_${Date.now()}`,
            signature: 'simulated_signature',
          });
          showToast('Payment confirmed successfully (Test/Simulated Mode)!', 'success');
          onSuccess?.();
          return;
        } catch (verifyErr) {
          console.warn('Simulation verification err', verifyErr);
        }
      }

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK is loading. Please try again in a few seconds.');
      }

      const options = {
        key: keyId,
        amount: Math.round(numericAmount * 100),
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
          color: '#2563eb',
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
      <div className="text-center p-6 bg-gray-50 rounded-2xl border border-gray-150">
        <p className="text-2xl font-black text-blue-600">
          {new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency,
          }).format(numericAmount)}
        </p>
        <p className="text-xs text-gray-500 mt-1 font-semibold">Total Amount to Pay</p>
      </div>
      <Button
        onClick={handlePayment}
        isLoading={isLoading}
        className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-sm shadow-md shadow-blue-500/20"
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
  const numericAmount = Number(amount) || 0;
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
    if (!wallet || Number(wallet.balance) < numericAmount) {
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
      <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
          <span>Wallet Balance</span>
          <span className={wallet && Number(wallet.balance) >= numericAmount ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
            {wallet ? `₹${Number(wallet.balance).toFixed(2)}` : 'Loading...'}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
          <span>Amount to Pay</span>
          <span className="text-gray-950 font-black text-sm">₹{numericAmount.toFixed(2)}</span>
        </div>
      </div>
      <Button
        onClick={handleWalletPay}
        isLoading={isLoading}
        disabled={!wallet || Number(wallet.balance) < numericAmount}
        className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-sm shadow-md shadow-blue-500/20"
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

const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  const { paymentType = 'booking' } = props;
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>(props.provider || 'RAZORPAY');

  return (
    <Card className="max-w-md mx-auto shadow-none border-0">
      <div className="p-2 sm:p-4">
        <h2 className="text-base font-extrabold text-gray-900 mb-3">
          Complete Payment
        </h2>

        {/* Tab selection */}
        <div className="flex border-b border-gray-200 mb-4 space-x-3">
          <button
            type="button"
            onClick={() => setSelectedProvider('RAZORPAY')}
            className={cn(
              'pb-2 text-xs sm:text-sm font-bold border-b-2 transition-all',
              selectedProvider === 'RAZORPAY'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            )}
          >
            UPI / Cards (Razorpay)
          </button>
          <button
            type="button"
            onClick={() => setSelectedProvider('STRIPE')}
            className={cn(
              'pb-2 text-xs sm:text-sm font-bold border-b-2 transition-all',
              selectedProvider === 'STRIPE'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            )}
          >
            Credit/Debit (Stripe)
          </button>
          {paymentType === 'booking' && props.bookingId && (
            <button
              type="button"
              onClick={() => setSelectedProvider('WALLET')}
              className={cn(
                'pb-2 text-xs sm:text-sm font-bold border-b-2 transition-all',
                selectedProvider === 'WALLET'
                  ? 'border-blue-600 text-blue-600'
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
          <p className="text-red-600 text-xs">Unsupported payment provider</p>
        )}
      </div>
    </Card>
  );
};

export default PaymentForm;
