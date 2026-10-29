'use client';

import React, { useState } from 'react';
import { Booking } from '@/types/booking';
import { formatCurrency } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { AlertTriangle, Clock, ArrowRight, RefreshCw } from 'lucide-react';

interface CancellationModalProps {
  booking: Booking;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

/** Estimate cancellation fee based on hours until departure */
function estimateCancellation(booking: Booking): {
  bookingAmount: number;
  cancellationFee: number;
  refundAmount: number;
  feeLabel: string;
  refundTimeline: string;
} {
  const bookingAmount = booking.finalAmount || booking.totalAmount || 0;
  const departureTime = booking.trip?.departureDate || booking.trip?.departureTime;

  let hoursUntilDeparture = Infinity;
  if (departureTime) {
    hoursUntilDeparture =
      (new Date(departureTime).getTime() - Date.now()) / (1000 * 60 * 60);
  }

  let cancellationFee = 0;
  let feeLabel = 'Free cancellation';
  let refundTimeline = '5–7 business days';

  if (hoursUntilDeparture < 0) {
    // Already departed
    cancellationFee = bookingAmount;
    feeLabel = 'No refund (trip already started)';
    refundTimeline = 'Not applicable';
  } else if (hoursUntilDeparture < 2) {
    // Within 2 hours
    cancellationFee = Math.round(bookingAmount * 0.75);
    feeLabel = '75% fee (within 2 hours of departure)';
    refundTimeline = '5–7 business days';
  } else if (hoursUntilDeparture < 24) {
    // Within 24 hours
    cancellationFee = Math.round(bookingAmount * 0.5);
    feeLabel = '50% fee (within 24 hours of departure)';
    refundTimeline = '5–7 business days';
  } else if (hoursUntilDeparture < 48) {
    // Within 48 hours
    cancellationFee = Math.round(bookingAmount * 0.1);
    feeLabel = '10% fee (within 48 hours of departure)';
    refundTimeline = '3–5 business days';
  } else {
    // More than 48 hours
    cancellationFee = 0;
    feeLabel = 'Free cancellation (more than 48 hours before departure)';
    refundTimeline = '2–3 business days';
  }

  return {
    bookingAmount,
    cancellationFee,
    refundAmount: bookingAmount - cancellationFee,
    feeLabel,
    refundTimeline,
  };
}

const CANCEL_REASONS = [
  'Change of plans',
  'Found a better option',
  'Emergency / personal reason',
  'Trip details incorrect',
  'Booked by mistake',
  'Other',
];

const CancellationModal: React.FC<CancellationModalProps> = ({
  booking,
  isOpen,
  isLoading = false,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  const estimate = estimateCancellation(booking);
  const currency = booking.currency || 'INR';
  const isFree = estimate.cancellationFee === 0;
  const isNoRefund = estimate.refundAmount === 0 && estimate.bookingAmount > 0;

  const handleConfirm = async () => {
    const finalReason = reason === 'Other' ? customReason || 'Other' : reason;
    await onConfirm(finalReason);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Booking"
      size="md"
    >
      <div className="space-y-5">
        {/* Warning Banner */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">
              Are you sure you want to cancel?
            </p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              {isFree
                ? 'This cancellation is free of charge.'
                : isNoRefund
                ? 'No refund will be issued as the trip has already started or the deadline has passed.'
                : 'A cancellation fee will be deducted from your refund.'}
            </p>
          </div>
        </div>

        {/* Refund Breakdown */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Refund Breakdown
            </h4>
          </div>
          <div className="px-4 py-3 space-y-2.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Booking Amount</span>
              <span className="font-semibold text-gray-800">
                {formatCurrency(estimate.bookingAmount, currency)}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span className="flex items-center gap-1">
                Cancellation Fee
                <span className="text-xs text-gray-400">({estimate.feeLabel})</span>
              </span>
              <span className={`font-semibold ${estimate.cancellationFee > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                − {formatCurrency(estimate.cancellationFee, currency)}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-gray-900">
              <span>You Will Receive</span>
              <span className={`text-lg ${isNoRefund ? 'text-gray-500' : 'text-emerald-600'}`}>
                {formatCurrency(estimate.refundAmount, currency)}
              </span>
            </div>
          </div>
          {!isNoRefund && (
            <div className="px-4 py-2.5 bg-gray-100 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              Refund will be processed within <strong className="text-gray-700">{estimate.refundTimeline}</strong>
              <ArrowRight className="w-3 h-3" />
              <span className="text-gray-600">to your original payment method</span>
            </div>
          )}
        </div>

        {/* Cancellation Reason */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
            Reason for Cancellation
          </label>
          <div className="grid grid-cols-1 gap-2">
            {CANCEL_REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors text-sm ${
                  reason === r
                    ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="cancel-reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="accent-primary-500"
                />
                {r}
              </label>
            ))}
          </div>
          {reason === 'Other' && (
            <textarea
              rows={2}
              placeholder="Please describe your reason..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full mt-2 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          )}
        </div>

        {/* Refund note */}
        {!isNoRefund && estimate.refundAmount > 0 && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700">
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            Your refund of <strong>{formatCurrency(estimate.refundAmount, currency)}</strong> will be initiated immediately after cancellation.
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-1">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1 font-bold rounded-xl"
            disabled={isLoading}
          >
            Keep Booking
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            isLoading={isLoading}
            className="flex-1 font-bold rounded-xl"
          >
            {isLoading ? 'Cancelling…' : 'Confirm Cancellation'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CancellationModal;
