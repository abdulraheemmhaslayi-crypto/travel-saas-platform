'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import WalletCard from '@/components/payments/WalletCard';
import TransactionList from '@/components/payments/TransactionList';
import Loading from '@/components/common/Loading';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import PaymentForm from '@/components/payments/PaymentForm';
import { Wallet as WalletIcon, TrendingUp, TrendingDown } from 'lucide-react';

import type { Wallet as WalletType, Transaction as TransactionType } from '@/types/payment';

export default function WalletPage() {
  const { showToast } = useAppStore();
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTopupPaymentModal, setShowTopupPaymentModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(0);
  const [topupProvider, setTopupProvider] = useState<'STRIPE' | 'RAZORPAY'>('RAZORPAY');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        apiClient.getWallet(),
        apiClient.getTransactions(),
      ]);
      setWallet(walletRes.data);
      setTransactions(txRes.data.data || txRes.data);
    } catch (error) {
      showToast('Failed to load wallet data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUp = async (amount: number, provider: 'STRIPE' | 'RAZORPAY') => {
    setTopupAmount(amount);
    setTopupProvider(provider);
    setShowTopupPaymentModal(true);
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading wallet..." />;
  }

  const totalCredits = transactions
    .filter((t) => t.type === 'CREDIT' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = transactions
    .filter((t) => t.type === 'DEBIT' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-600 mt-1">Manage your balance and transactions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {wallet && <WalletCard wallet={wallet} onTopUp={handleTopUp} />}

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">Total In</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  ₹{totalCredits.toFixed(2)}
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-600">Total Out</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  ₹{totalDebits.toFixed(2)}
                </p>
              </div>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-2">
          <TransactionList transactions={transactions} />
        </div>
      </div>

      {showTopupPaymentModal && (
        <Modal
          isOpen={showTopupPaymentModal}
          onClose={() => setShowTopupPaymentModal(false)}
          title="Complete Wallet Top-Up"
          size="md"
        >
          <PaymentForm
            amount={topupAmount}
            currency="INR"
            provider={topupProvider}
            paymentType="wallet_topup"
            onSuccess={() => {
              setShowTopupPaymentModal(false);
              showToast('Wallet top-up initiated! Please reload after a brief moment for webhook processing.', 'success');
              setTimeout(() => loadWalletData(), 3000);
            }}
            onError={(err) => showToast(err, 'error')}
          />
        </Modal>
      )}
    </div>
  );
}