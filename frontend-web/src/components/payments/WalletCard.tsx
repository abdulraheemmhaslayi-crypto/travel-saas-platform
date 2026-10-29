'use client';

import React, { useState } from 'react';
import { Wallet } from '@/types/payment';
import { formatCurrency, cn } from '@/lib/utils';
import { Wallet as WalletIcon, Plus, ArrowUpRight } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';

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

  return (
    <>
      <Card className="bg-slate-900 text-white border-0" shadow="none">
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl border border-white/10 text-white">
                <WalletIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Wallet Balance</p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(wallet.balance, wallet.currency)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={cn(
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide',
                wallet.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              )}>
                {wallet.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <Button
              variant="secondary"
              onClick={() => setIsTopUpOpen(true)}
              className="flex-1 bg-white text-slate-900 hover:bg-slate-50 border-0 rounded-xl font-semibold text-xs py-2 shadow-none"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Top Up
            </Button>
            <Button
              variant="ghost"
              className="flex-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl text-xs py-2"
            >
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
              Transfer
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        title="Top Up Wallet"
        size="sm"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => setTopUpAmount(amount.toString())}
                className={cn(
                  'p-3 rounded-lg border text-center transition-colors',
                  topUpAmount === amount.toString()
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <span className="font-medium">{formatCurrency(amount, wallet.currency)}</span>
              </button>
            ))}
          </div>

          <Input
            label="Or enter custom amount"
            type="number"
            placeholder="Enter amount"
            value={topUpAmount}
            onChange={(e) => setTopUpAmount(e.target.value)}
            min={1}
          />

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Select Payment Gateway</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProvider('STRIPE')}
                className={cn(
                  'p-3 rounded-lg border text-center transition-colors text-xs font-semibold',
                  provider === 'STRIPE'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                )}
              >
                Card (Stripe)
              </button>
              <button
                type="button"
                onClick={() => setProvider('RAZORPAY')}
                className={cn(
                  'p-3 rounded-lg border text-center transition-colors text-xs font-semibold',
                  provider === 'RAZORPAY'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                )}
              >
                UPI/Bank (Razorpay)
              </button>
            </div>
          </div>

          <Button
            onClick={handleTopUp}
            isLoading={isLoading}
            disabled={!topUpAmount || parseFloat(topUpAmount) <= 0}
            className="w-full"
          >
            Add Money
          </Button>
        </div>
      </Modal>
    </>
  );
};



export default WalletCard;