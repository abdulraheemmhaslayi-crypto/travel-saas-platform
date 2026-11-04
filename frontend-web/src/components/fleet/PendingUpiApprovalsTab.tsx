'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import {
  CheckCircle2,
  XCircle,
  Copy,
  Receipt,
  User,
  Phone,
  Route,
  Clock,
  Coins,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

interface PendingBooking {
  id: string;
  bookingNumber: string;
  tripId: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  utrNumber?: string;
  paymentReceiptUrl?: string;
  totalAmount: number;
  finalAmount: number;
  platformFee: number;
  numberOfSeats: number;
  seatNumbers?: string[];
  passenger?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  passengerName?: string;
  passengerPhone?: string;
  passengerEmail?: string;
  trip?: {
    source: string;
    destination: string;
    departureTime: string;
    vehicle?: {
      registrationNumber: string;
      model?: string;
    };
  };
  cancellationUpiId?: string;
  cancellationRefundStatus?: string;
  cancellationRefundUtr?: string;
  refundAmount?: number;
  createdAt: string;
}

export default function PendingUpiApprovalsTab() {
  const { showToast } = useAppStore();
  const [bookings, setBookings] = useState<PendingBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedBookingForReject, setSelectedBookingForReject] = useState<PendingBooking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Payment not received or invalid UTR number');

  // Refund modal state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedBookingForRefund, setSelectedBookingForRefund] = useState<PendingBooking | null>(null);
  const [refundUtr, setRefundUtr] = useState('');

  const loadPending = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getOwnerPendingVerifications();
      setBookings(res.data?.data || res.data || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load pending payments', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`, 'success');
  };

  const handleApprove = async (booking: PendingBooking) => {
    setActionLoading(booking.id);
    try {
      await apiClient.verifyUpiPayment(booking.id, { action: 'APPROVE' });
      showToast(
        `Payment approved for Booking #${booking.bookingNumber}! Seats confirmed & platform commission auto-deducted from wallet.`,
        'success'
      );
      loadPending();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve payment', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedBookingForReject) return;
    setActionLoading(selectedBookingForReject.id);
    try {
      await apiClient.verifyUpiPayment(selectedBookingForReject.id, {
        action: 'REJECT',
        rejectionReason: rejectionReason.trim(),
      });
      showToast(`Payment rejected for Booking #${selectedBookingForReject.bookingNumber}. Seats released.`, 'info');
      setRejectModalOpen(false);
      setSelectedBookingForReject(null);
      loadPending();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject payment', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefundConfirm = async () => {
    if (!selectedBookingForRefund || !refundUtr.trim()) {
      showToast('Please enter the 12-digit UPI refund UTR reference number', 'error');
      return;
    }
    setActionLoading(selectedBookingForRefund.id);
    try {
      await apiClient.processOwnerRefund(selectedBookingForRefund.id, {
        refundUtr: refundUtr.trim(),
      });
      showToast(
        `Refund recorded successfully! Platform commission reversed back to your wallet.`,
        'success'
      );
      setRefundModalOpen(false);
      setSelectedBookingForRefund(null);
      setRefundUtr('');
      loadPending();
    } catch (err: any) {
      showToast(err.message || 'Failed to record refund', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Split into pending payments vs pending cancellation refunds
  const pendingApprovals = bookings.filter(
    (b) => (b.status || '').toUpperCase() === 'PENDING_APPROVAL' || (b.paymentStatus || '').toLowerCase() === 'processing'
  );

  const pendingRefunds = bookings.filter(
    (b) => (b.status || '').toUpperCase() === 'CANCELLED' && b.cancellationRefundStatus === 'PENDING'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 border border-gray-200 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">
              Direct UPI Payment Verifications
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {pendingApprovals.length} Pending
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Passengers pay directly to your Bank/UPI QR. Verify their 12-digit UTR in your bank app and approve their seat booking.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={loadPending} disabled={isLoading}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <Loading text="Loading pending UPI approvals..." />
      ) : (
        <>
          {/* Section 1: Pending Approvals */}
          {pendingApprovals.length === 0 ? (
            <Card className="border border-gray-200 p-8 text-center bg-white">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-gray-900">All clear! No pending payments</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                When passengers submit UPI payments with their UTR numbers, they will appear here for 1-click verification.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((b) => {
                const passName = b.passenger?.name || b.passengerName || 'Passenger';
                const passPhone = b.passenger?.phone || b.passengerPhone || 'N/A';
                const origin = b.trip?.source || 'Origin';
                const dest = b.trip?.destination || 'Destination';
                const seatCount = b.numberOfSeats || b.seatNumbers?.length || 1;
                const seatsFormatted = b.seatNumbers && b.seatNumbers.length > 0 ? b.seatNumbers.join(', ') : `${seatCount} seat(s)`;
                const isWorking = actionLoading === b.id;

                return (
                  <Card
                    key={b.id}
                    className="border border-gray-200 shadow-sm p-4 sm:p-5 bg-white hover:border-blue-200 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Passenger & Route Details */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            #{b.bookingNumber}
                          </span>
                          <span className="text-xs font-bold text-gray-900 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-gray-500" />
                            {passName}
                          </span>
                          <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {passPhone}
                          </span>
                        </div>

                        <div className="text-xs text-gray-700 flex items-center gap-1.5 flex-wrap">
                          <Route className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-semibold text-gray-900">{origin}</span>
                          <span>→</span>
                          <span className="font-semibold text-gray-900">{dest}</span>
                          <span className="text-gray-400">•</span>
                          <span>Seats: <strong className="text-gray-900">{seatsFormatted}</strong></span>
                          {b.trip?.vehicle?.registrationNumber && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">
                                {b.trip.vehicle.registrationNumber}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Middle: UTR & Amount */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100 shrink-0">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            Passenger UTR
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-sm font-extrabold text-blue-900">
                              {b.utrNumber || 'No UTR provided'}
                            </span>
                            {b.utrNumber && (
                              <button
                                type="button"
                                onClick={() => handleCopy(b.utrNumber!, 'UTR number')}
                                className="text-gray-400 hover:text-blue-600 p-0.5"
                                title="Copy UTR"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="sm:border-l sm:border-gray-200 sm:pl-4">
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            Payment Amount
                          </p>
                          <p className="text-base font-extrabold text-emerald-700 mt-0.5">
                            ₹{b.finalAmount || b.totalAmount}
                          </p>
                        </div>
                      </div>

                      {/* Right: Approve / Reject Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(b)}
                          disabled={isWorking}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          {isWorking ? 'Approving...' : 'Approve Payment'}
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedBookingForReject(b);
                            setRejectModalOpen(true);
                          }}
                          disabled={isWorking}
                          className="text-red-600 hover:bg-red-50 border-red-200"
                        >
                          <XCircle className="w-4 h-4 mr-1.5" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Section 2: Pending Cancellation Refunds (if any) */}
          {pendingRefunds.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-gray-900">
                  Pending Cancellation Refunds ({pendingRefunds.length})
                </h3>
              </div>
              <p className="text-xs text-gray-500">
                These passengers cancelled their rides within the policy window. Send their refund via UPI and record the UTR number below to reverse the Super Admin commission back into your wallet!
              </p>

              <div className="space-y-3">
                {pendingRefunds.map((b) => (
                  <Card key={b.id} className="border border-purple-200 p-4 bg-purple-50/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-purple-900">
                            #{b.bookingNumber}
                          </span>
                          <span className="text-xs font-bold text-gray-900">
                            {b.passenger?.name || b.passengerName}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Passenger UPI: <strong className="font-mono text-purple-800">{b.cancellationUpiId || 'Contact passenger'}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Refund Due</p>
                          <p className="text-sm font-extrabold text-purple-900">₹{b.refundAmount || b.totalAmount}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedBookingForRefund(b);
                            setRefundModalOpen(true);
                          }}
                        >
                          Record Refund UTR
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Reject Payment Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject UPI Payment"
      >
        <div className="space-y-4 p-1">
          <p className="text-xs text-gray-600">
            Are you sure you want to reject the payment for booking #{selectedBookingForReject?.bookingNumber}? The reserved seat(s) will be released back to other passengers immediately.
          </p>

          <Input
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            helperText="The passenger will see this explanation in their notification."
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRejectConfirm}>
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Record Refund Modal */}
      <Modal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        title="Send & Record Passenger UPI Refund"
      >
        <div className="space-y-4 p-1">
          <p className="text-xs text-gray-600">
            Please transfer <strong>₹{selectedBookingForRefund?.refundAmount || selectedBookingForRefund?.totalAmount}</strong> to the passenger's UPI handle: <strong className="font-mono text-purple-700">{selectedBookingForRefund?.cancellationUpiId}</strong>, then enter the 12-digit UPI reference (UTR) below.
          </p>

          <Input
            label="12-digit Refund UTR Number"
            placeholder="e.g. 431289123456"
            value={refundUtr}
            onChange={(e) => setRefundUtr(e.target.value)}
          />

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
            <strong>Automatic Commission Reversal:</strong> Once confirmed, the Super Admin platform fee (₹{selectedBookingForRefund?.platformFee || 0}) will be immediately credited back to your Fleet Wallet!
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setRefundModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRefundConfirm}>
              Submit Refund UTR
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
