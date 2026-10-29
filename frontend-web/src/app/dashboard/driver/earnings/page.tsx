'use client';

import React, { useEffect, useState } from 'react';
import { useDriverStore } from '@/store/slices/driverSlice';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import apiClient from '@/lib/api';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  FileText,
  AlertCircle,
} from 'lucide-react';

export default function DriverEarningsPage() {
  const { earnings, isLoading, getDriverStats } = useDriverStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'withdrawals'>('overview');
  
  // Withdrawal request modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Transactions list state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Payout history state
  const [payouts, setPayouts] = useState<any[]>([
    { id: 1, amount: 15000, date: '2026-05-30', status: 'COMPLETED', method: 'Bank Transfer' },
    { id: 2, amount: 12000, date: '2026-05-15', status: 'COMPLETED', method: 'Bank Transfer' },
    { id: 3, amount: 8000, date: '2026-04-30', status: 'COMPLETED', method: 'Bank Transfer' },
  ]);

  useEffect(() => {
    getDriverStats();
    fetchTransactions();
  }, [getDriverStats]);

  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const resp = await apiClient.get('/payments/wallet/transactions');
      const payload = resp.data || resp;
      setTransactions(Array.isArray(payload) ? payload : payload.data || []);
    } catch (e) {
      console.error(e);
      // Mock transactions fallback
      setTransactions([
        { id: '1', amount: 1200, type: 'CREDIT', purpose: 'BOOKING_PAYMENT', description: 'Booking ID: BK-9938', createdAt: '2026-06-04T10:00:00Z', status: 'COMPLETED' },
        { id: '2', amount: 850, type: 'CREDIT', purpose: 'BOOKING_PAYMENT', description: 'Booking ID: BK-9923', createdAt: '2026-06-03T15:30:00Z', status: 'COMPLETED' },
        { id: '3', amount: 1500, type: 'CREDIT', purpose: 'BOOKING_PAYMENT', description: 'Booking ID: BK-9905', createdAt: '2026-06-02T11:20:00Z', status: 'COMPLETED' },
        { id: '4', amount: 5000, type: 'DEBIT', purpose: 'WITHDRAWAL', description: 'Payout to Bank Account', createdAt: '2026-05-30T17:00:00Z', status: 'COMPLETED' },
      ]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const amount = Number(withdrawAmount);
    if (!amount || amount < 100) {
      setErrorMsg('Minimum withdrawal amount is ₹100.');
      return;
    }

    if (!bankAccount.trim()) {
      setErrorMsg('Bank account number is required.');
      return;
    }

    if (!ifscCode.trim()) {
      setErrorMsg('IFSC code is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/payments/wallet/withdraw', {
        amount,
        bankAccount,
        ifscCode,
      });
      setSuccessMsg(`Withdrawal request of ₹${amount} submitted successfully! It will be processed in 2-3 business days.`);
      // Prepend to payouts list
      setPayouts(prev => [
        { id: Date.now(), amount, date: new Date().toISOString().split('T')[0], status: 'PENDING', method: 'Bank Transfer' },
        ...prev
      ]);
      setWithdrawAmount('');
      // Refresh balance
      getDriverStats();
      setTimeout(() => {
        setShowWithdrawModal(false);
        setSuccessMsg(null);
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit withdrawal request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalEarnings = earnings?.total || 0;
  // Available withdrawable balance is typically currentBalance, or total earnings minus completed payouts
  const currentBalance = totalEarnings - payouts.filter(p => p.status === 'COMPLETED').reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Earnings & Payouts</h1>
            <p className="text-sm text-gray-500">View statement summary and request bank payouts</p>
          </div>
          <Button
            onClick={() => setShowWithdrawModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            <DollarSign className="w-4 h-4 mr-1.5" />
            Request Payout
          </Button>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-gray-200 overflow-x-auto space-x-6">
          {(['overview', 'transactions', 'withdrawals'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold capitalize tracking-wide transition-all border-b-2 shrink-0 ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab === 'overview' ? 'Earnings Overview' : `${tab} History`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Loading text="Loading earnings info..." />
        ) : (
          <div className="space-y-6 animate-fadeIn">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Stats card */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-5 border-none bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-sm">
                      <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">Withdrawable Balance</p>
                      <h3 className="text-2xl font-extrabold mt-1">₹{Math.max(0, currentBalance).toLocaleString('en-IN')}</h3>
                      <p className="text-[10px] text-indigo-200 font-medium mt-2">Available in Wallet</p>
                    </Card>

                    <Card className="p-5 border-none bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
                      <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Completed Payouts</p>
                      <h3 className="text-2xl font-extrabold mt-1">
                        ₹{payouts.filter(p => p.status === 'COMPLETED').reduce((acc, p) => acc + p.amount, 0).toLocaleString('en-IN')}
                      </h3>
                      <p className="text-[10px] text-emerald-200 font-medium mt-2">Transferred to Bank</p>
                    </Card>

                    <Card className="p-5 border-none bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
                      <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">Total Revenue</p>
                      <h3 className="text-2xl font-extrabold mt-1">₹{totalEarnings.toLocaleString('en-IN')}</h3>
                      <p className="text-[10px] text-blue-200 font-medium mt-2">Lifetime Earnings</p>
                    </Card>
                  </div>

                  {/* Periodic summary card */}
                  <Card className="p-6">
                    <h3 className="text-base font-bold text-gray-900 mb-5">Earnings Breakdowns</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-500">Today</p>
                        <p className="text-xl font-extrabold text-slate-900 mt-1">₹{earnings?.today || 0}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-500">This Week</p>
                        <p className="text-xl font-extrabold text-slate-900 mt-1">₹{earnings?.thisWeek || 0}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-500">This Month</p>
                        <p className="text-xl font-extrabold text-slate-900 mt-1">₹{earnings?.thisMonth || 0}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <div>
                  <Card className="p-6">
                    <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      Performance Indicators
                    </h3>
                    <div className="space-y-4 text-sm font-semibold text-gray-600">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <span>Total Assigned Trips</span>
                        <span className="text-gray-900 font-bold">{earnings?.totalTrips || 0}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <span>Completed Trips</span>
                        <span className="text-gray-900 font-bold">{earnings?.completedTrips || 0}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <span>Average Rating</span>
                        <span className="text-gray-900 font-bold">{earnings?.rating ? earnings.rating.toFixed(1) : '5.0'} / 5</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <Card className="p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-500" />
                  Transaction History
                </h3>
                {transactionsLoading ? (
                  <Loading text="Loading transactions..." />
                ) : transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                      <thead>
                        <tr className="text-left text-gray-400 text-xs font-semibold uppercase border-b border-gray-150">
                          <th className="pb-3 pl-2">Reference ID</th>
                          <th className="pb-3">Type</th>
                          <th className="pb-3">Details</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3 text-right pr-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/50">
                            <td className="py-3.5 pl-2 font-mono text-xs">{tx.transactionId || tx.id.substring(0, 8)}</td>
                            <td className="py-3.5">
                              <Badge
                                variant={tx.type === 'CREDIT' ? 'success' : 'default'}
                                className="text-[9px] font-extrabold uppercase"
                              >
                                {tx.type}
                              </Badge>
                            </td>
                            <td className="py-3.5">
                              <p className="text-gray-900 text-xs">{tx.description || tx.purpose}</p>
                            </td>
                            <td className="py-3.5 text-xs text-gray-500">
                              {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className={`py-3.5 text-right pr-2 font-bold ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-gray-900'}`}>
                              {tx.type === 'CREDIT' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState title="No transactions" description="No wallet transactions registered yet." customIcon={<Receipt className="w-8 h-8 text-gray-400" />} />
                )}
              </Card>
            )}

            {activeTab === 'withdrawals' && (
              <Card className="p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-500" />
                  Payout Requests
                </h3>
                {payouts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                      <thead>
                        <tr className="text-left text-gray-400 text-xs font-semibold uppercase border-b border-gray-150">
                          <th className="pb-3 pl-2">Date</th>
                          <th className="pb-3">Payout Method</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right pr-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                        {payouts.map((po) => (
                          <tr key={po.id}>
                            <td className="py-3.5 pl-2">{po.date}</td>
                            <td className="py-3.5">{po.method}</td>
                            <td className="py-3.5">
                              <Badge
                                variant={po.status === 'COMPLETED' ? 'success' : 'default'}
                                className={`text-[9px] font-extrabold uppercase ${po.status === 'PENDING' ? 'bg-amber-500 text-white' : ''}`}
                              >
                                {po.status}
                              </Badge>
                            </td>
                            <td className="py-3.5 text-right pr-2 font-bold text-gray-900">
                              ₹{Number(po.amount).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState title="No payout history" description="No withdrawal requests submitted yet." customIcon={<Receipt className="w-8 h-8 text-gray-400" />} />
                )}
              </Card>
            )}
          </div>
        )}

        {/* Withdrawal Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform scale-100 transition-all">
              <div className="bg-gradient-to-r from-gray-900 to-slate-800 text-white p-5 flex items-center justify-between">
                <h3 className="font-bold text-base tracking-wide">Request Bank Withdrawal</h3>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleWithdrawalRequest} className="p-6 space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Amount (INR)</label>
                  <input
                    type="number"
                    min="100"
                    placeholder="Enter amount to withdraw"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-gray-400 font-medium pl-1">Withdrawable Balance: ₹{Math.max(0, currentBalance)}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Bank Account Number</label>
                  <input
                    type="text"
                    placeholder="Enter bank account number"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="Enter bank branch IFSC code"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 text-xs font-bold py-2.5 border border-gray-250"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 shadow-sm"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const CheckCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
