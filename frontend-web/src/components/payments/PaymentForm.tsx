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
import {
  QrCode,
  Copy,
  CheckCircle2,
  Wallet,
  CreditCard,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
} from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY || '');

interface PaymentFormProps {
  amount: number | string;
  currency?: string;
  bookingId?: string;
  ownerUpiId?: string;
  ownerName?: string;
  ownerQrCodeUrl?: string;
  paymentType?: 'booking' | 'wallet_topup';
  provider?: PaymentProvider;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Direct Vehicle Owner UPI & QR Code Form (Primary Default)
// ─────────────────────────────────────────────────────────────────────────────
const DirectUpiPaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  currency = 'INR',
  bookingId,
  ownerUpiId,
  ownerName,
  ownerQrCodeUrl,
  onSuccess,
  onError,
}) => {
  const numericAmount = Number(amount) || 0;
  const { showToast } = useAppStore();

  const upiId = ownerUpiId || 'kokantravel.fleet@okaxis';
  const payeeName = ownerName || 'Vehicle Fleet Partner';

  const [copied, setCopied] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Build standard dynamic UPI intent URI
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${numericAmount}&cu=INR&tn=${encodeURIComponent(`Booking_${bookingId || 'Ticket'}`)}`;

  // Generate dynamic QR code image URL if custom image is not uploaded
  const qrDisplayUrl =
    ownerQrCodeUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(
      upiUri
    )}`;

  const handleCopyUpi = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      showToast('UPI ID copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleLaunchUpi = () => {
    if (typeof window !== 'undefined') {
      window.location.href = upiUri;
    }
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUtr = utrNumber.trim();
    if (!cleanUtr) {
      showToast('Please enter the 12-digit UPI Reference / UTR Number', 'error');
      return;
    }
    if (cleanUtr.length < 8) {
      showToast('UTR Number must be at least 8-12 characters long', 'error');
      return;
    }
    if (!bookingId) {
      showToast('Booking ID is missing', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.submitUpiPayment(bookingId, {
        utrNumber: cleanUtr,
        paymentReceiptUrl: receiptUrl.trim() || undefined,
      });

      setIsSubmitted(true);
      showToast('Payment submitted! Vehicle Owner will verify shortly.', 'success');
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit payment details';
      onError?.(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center p-5 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-emerald-950">Payment Submitted!</h3>
          <p className="text-xs text-emerald-700 mt-1">
            UTR Number: <span className="font-mono font-bold">{utrNumber}</span>
          </p>
          <p className="text-[11px] text-emerald-600/90 mt-1 leading-relaxed">
            The vehicle operator has been notified to verify your payment. Your booking will automatically switch to confirmed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Total Payable Banner ── */}
      <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl">
        <div>
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
            Direct Vehicle Owner Payment
          </span>
          <p className="text-xl font-black text-blue-900 mt-0.5">
            ₹{numericAmount.toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-500 block">Operator</span>
          <p className="text-xs font-bold text-slate-800 max-w-[150px] truncate">
            {payeeName}
          </p>
        </div>
      </div>

      {/* ── QR Code & UPI Scan Container ── */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <QrCode className="w-4 h-4 text-blue-600" />
          <span>Scan with Google Pay, PhonePe, Paytm, or BHIM</span>
        </p>

        {/* QR Code Frame */}
        <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDisplayUrl}
            alt="Payment QR Code"
            className="w-48 h-48 object-contain rounded-lg"
          />
        </div>

        {/* UPI ID Pill with 1-Tap Copy */}
        <div className="w-full max-w-sm flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs shadow-2xs">
          <div className="min-w-0 flex-1 text-left mr-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Owner UPI ID</span>
            <span className="font-mono font-bold text-slate-800 text-xs truncate block select-all">
              {upiId}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyUpi}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 shrink-0"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Mobile 1-Tap UPI Launch Intent */}
        <button
          type="button"
          onClick={handleLaunchUpi}
          className="w-full max-w-sm py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <Smartphone className="w-4 h-4" />
          <span>Tap to Pay on GPay / PhonePe / Paytm</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-75" />
        </button>
      </div>

      {/* ── UTR Submission Form ── */}
      <form onSubmit={handleSubmitUtr} className="space-y-3 pt-1">
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">
            Enter 12-Digit UPI Reference (UTR) Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 431289123456 or transaction ID"
            value={utrNumber}
            onChange={(e) => setUtrNumber(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs"
            required
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Check your payment receipt in GPay / PhonePe for the 12-digit UTR or Reference No.
          </p>
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={!utrNumber.trim()}
          className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all"
        >
          Submit Payment for Verification
        </Button>
      </form>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. In-App Wallet Payment Form
// ─────────────────────────────────────────────────────────────────────────────
const WalletPaymentForm: React.FC<PaymentFormProps> = ({
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
    apiClient
      .getWallet()
      .then((res: any) => setWallet(res.data))
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
          <span>Kokan Travel Wallet Balance</span>
          <span
            className={
              wallet && Number(wallet.balance) >= numericAmount
                ? 'text-green-600 font-bold'
                : 'text-red-600 font-bold'
            }
          >
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
        Confirm Wallet Payment (1-Click)
      </Button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Fallback Razorpay Payment Form
// ─────────────────────────────────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay?: new (options: any) => { open: () => void };
  }
}

const RazorpayPaymentForm: React.FC<PaymentFormProps> = ({
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

      if (orderId && orderId.startsWith('order_mock_')) {
        try {
          await apiClient.verifyRazorpayPayment({
            orderId,
            paymentId: `pay_mock_${Date.now()}`,
            signature: 'simulated_signature',
          });
          showToast('Payment confirmed successfully (Test Mode)!', 'success');
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
        name: 'Kokan Travel',
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
        prefill: { name: '', email: '', contact: '' },
        theme: { color: '#2563eb' },
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
          ₹{numericAmount.toFixed(2)}
        </p>
        <p className="text-xs text-gray-500 mt-1 font-semibold">Total Amount</p>
      </div>
      <Button
        onClick={handlePayment}
        isLoading={isLoading}
        className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-sm shadow-md shadow-blue-500/20"
      >
        Pay via Razorpay
      </Button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Master PaymentForm (Direct UPI QR is Primary Default)
// ─────────────────────────────────────────────────────────────────────────────
const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  const { paymentType = 'booking' } = props;
  // Default to DIRECT_UPI!
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>(
    props.provider || 'DIRECT_UPI'
  );

  return (
    <Card className="max-w-md mx-auto shadow-none border-0">
      <div className="p-1 sm:p-3">
        {/* Method selection tabs */}
        <div className="flex border-b border-gray-200 mb-4 space-x-2 overflow-x-auto [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => setSelectedProvider('DIRECT_UPI')}
            className={cn(
              'pb-2 px-1 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap',
              selectedProvider === 'DIRECT_UPI'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            )}
          >
            <QrCode className="w-4 h-4" />
            <span>Direct UPI / QR</span>
          </button>

          {paymentType === 'booking' && props.bookingId && (
            <button
              type="button"
              onClick={() => setSelectedProvider('WALLET')}
              className={cn(
                'pb-2 px-1 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap',
                selectedProvider === 'WALLET'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              )}
            >
              <Wallet className="w-4 h-4" />
              <span>Wallet</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSelectedProvider('RAZORPAY')}
            className={cn(
              'pb-2 px-1 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap',
              selectedProvider === 'RAZORPAY'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            )}
          >
            <CreditCard className="w-4 h-4" />
            <span>Gateway / Cards</span>
          </button>
        </div>

        {selectedProvider === 'DIRECT_UPI' ? (
          <DirectUpiPaymentForm {...props} />
        ) : selectedProvider === 'WALLET' ? (
          <WalletPaymentForm {...props} />
        ) : (
          <RazorpayPaymentForm {...props} />
        )}
      </div>
    </Card>
  );
};

export default PaymentForm;
