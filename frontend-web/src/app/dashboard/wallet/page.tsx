'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import WalletCard from '@/components/payments/WalletCard';
import TransactionList from '@/components/payments/TransactionList';
import Loading from '@/components/common/Loading';
import Modal from '@/components/ui/Modal';
import PaymentForm from '@/components/payments/PaymentForm';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Wallet as WalletType, Transaction as TransactionType } from '@/types/payment';

export default function WalletPage() {
  const { showToast } = useAppStore();
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTopupPaymentModal, setShowTopupPaymentModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(0);
  const [topupProvider, setTopupProvider] = useState<'STRIPE' | 'RAZORPAY'>('RAZORPAY');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const [walletRes, txRes] = await Promise.all([
        apiClient.getWallet(),
        apiClient.getTransactions(),
      ]);
      setWallet(walletRes.data);
      const rawTx = txRes.data?.data || txRes.data;
      setTransactions(Array.isArray(rawTx) ? rawTx : []);
      if (isManualRefresh) showToast('Wallet balance updated', 'info');
    } catch (error) {
      showToast('Failed to load wallet data', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleTopUp = async (amount: number, provider: 'STRIPE' | 'RAZORPAY') => {
    setTopupAmount(amount);
    setTopupProvider(provider);
    setShowTopupPaymentModal(true);
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading your wallet..." />;
  }

  // Safe numerical sum calculations to avoid string concatenation
  const totalCredits = transactions
    .filter((t) => t.type === 'CREDIT' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalDebits = transactions
    .filter((t) => t.type === 'DEBIT' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 w-full min-w-0 pb-28 md:pb-12">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Wallet
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Manage your balance and transaction history
          </p>
        </div>

        <button
          onClick={() => loadWalletData(true)}
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200/80 transition-colors disabled:opacity-50 active:scale-95 shadow-2xs shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Main Grid Layout ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column (Desktop) / Top Section (Mobile): Card & Quick Stats */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          {wallet ? (
            <WalletCard wallet={wallet} onTopUp={handleTopUp} />
          ) : (
            <div className="p-6 bg-white rounded-3xl border border-gray-200 text-center">
              <p className="text-sm font-bold text-gray-700">No active wallet found.</p>
            </div>
          )}

          {/* Quick Flow Stats (Unified 2-Column Card) */}
          <div className="rounded-2xl bg-white border border-gray-200/90 shadow-2xs p-3">
            <div className="grid grid-cols-2 divide-x divide-gray-100 text-center">
              {/* Total In */}
              <div className="px-2">
                <div className="flex items-center justify-center gap-1 mb-1 text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total In</span>
                </div>
                <p className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                  {formatCurrency(totalCredits, 'INR')}
                </p>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Added to wallet</p>
              </div>

              {/* Total Out */}
              <div className="px-2">
                <div className="flex items-center justify-center gap-1 mb-1 text-rose-500">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Out</span>
                </div>
                <p className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                  {formatCurrency(totalDebits, 'INR')}
                </p>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Spent on rides</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Desktop) / Lower Section (Mobile): Transactions */}
        <div className="lg:col-span-2">
          <TransactionList transactions={transactions} />
        </div>
      </div>

      {/* ── Topup Payment Gateway Modal ──────────────────────────────────── */}
      {showTopupPaymentModal && (
        <Modal
          isOpen={showTopupPaymentModal}
          onClose={() => setShowTopupPaymentModal(false)}
          title="Complete Wallet Recharge"
          size="md"
        >
          <PaymentForm
            amount={topupAmount}
            currency="INR"
            provider={topupProvider}
            paymentType="wallet_topup"
            onSuccess={() => {
              setShowTopupPaymentModal(false);
              showToast('Recharge successful! Wallet balance refreshed.', 'success');
              setTimeout(() => loadWalletData(), 1500);
            }}
            onError={(err) => showToast(err, 'error')}
          />
        </Modal>
      )}
    </div>
  );
}
