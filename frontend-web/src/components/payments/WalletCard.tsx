'use client';

import React, { useState } from 'react';
import { Wallet } from '@/types/payment';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface WalletCardProps {
  wallet: Wallet;
  onTopUp?: (amount: number, provider: 'STRIPE' | 'RAZORPAY') => Promise<void>;
}

const WalletCard: React.FC<WalletCardProps> = ({ wallet, onTopUp }) => {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [provider, setProvider] = useState<'STRIPE' | 'RAZORPAY'>('RAZORPAY');
  const [isLoading, setIsLoading] = useState(false);

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsLoading(true);
    try {
      await onTopUp?.(amount, provider);
      setIsTopUpOpen(false);
      setTopUpAmount('');
    } finally {
      setIsLoading(false);
    }
  };

  const quickAmounts = [100, 500, 1000, 2000];
  const numericBalance = Number(wallet.balance) || 0;

  return (
    <>
      {/* ── Clean Minimalist White Card (No Gimmicks / No Fake Gradients) ── */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <WalletIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">Wallet Balance</p>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-0.5">
                {formatCurrency(numericBalance, wallet.currency || 'INR')}
              </p>
            </div>
          </div>

          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0',
              wallet.isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-gray-100 text-gray-600 border-gray-200'
            )}
          >
            {wallet.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Clean Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mt-5 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setIsTopUpOpen(true)}
            className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Money</span>
          </button>

          <button
            type="button"
            onClick={() => {
              // Quick preset 500 top-up prompt
              setTopUpAmount('500');
              setIsTopUpOpen(true);
            }}
            className="h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4 text-gray-500" />
            <span>Top Up ₹500</span>
          </button>
        </div>
      </div>

      {/* ── Top-Up Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        title="Add Money to Wallet"
        size="sm"
      >
        <div className="space-y-4 pt-1">
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-2">
              Select Amount
            </label>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amount) => {
                const isSelected = topUpAmount === amount.toString();
                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setTopUpAmount(amount.toString())}
                    className={cn(
                      'py-2 rounded-xl border text-center font-bold text-xs transition-all active:scale-95',
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                    )}
                  >
                    ₹{amount}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">
              Or Enter Amount
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                placeholder="Enter amount"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                min={1}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600 block">
              Payment Gateway
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProvider('RAZORPAY')}
                className={cn(
                  'p-2.5 rounded-xl border text-center text-xs font-bold transition-all',
                  provider === 'RAZORPAY'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                )}
              >
                Razorpay (UPI / Card)
              </button>

              <button
                type="button"
                onClick={() => setProvider('STRIPE')}
                className={cn(
                  'p-2.5 rounded-xl border text-center text-xs font-bold transition-all',
                  provider === 'STRIPE'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                )}
              >
                Stripe (Cards)
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleTopUp}
            disabled={isLoading || !topUpAmount || parseFloat(topUpAmount) <= 0}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>{isLoading ? 'Processing...' : `Add ₹${topUpAmount || '0'}`}</span>
          </button>
        </div>
      </Modal>
    </>
  );
};

export default WalletCard;
