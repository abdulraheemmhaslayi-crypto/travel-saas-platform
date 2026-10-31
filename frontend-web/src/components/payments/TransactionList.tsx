'use client';

import React, { useState } from 'react';
import { Transaction } from '@/types/payment';
import { formatDateTime, formatCurrency, cn } from '@/lib/utils';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Receipt,
  Car,
  Plus,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isLoading = false,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT' | 'PENDING'>('ALL');

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'CREDIT') return tx.type === 'CREDIT';
    if (filter === 'DEBIT') return tx.type === 'DEBIT';
    if (filter === 'PENDING') return tx.status === 'PENDING';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
            <span>Success</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-2.5 h-2.5 text-amber-600 animate-spin" />
            <span>Pending</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-2.5 h-2.5 text-rose-600" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
            <span>{status}</span>
          </span>
        );
    }
  };

  const getTransactionIcon = (tx: Transaction) => {
    const isCredit = tx.type === 'CREDIT';
    const isFailed = tx.status === 'FAILED';

    if (isFailed) {
      return (
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
          <XCircle className="w-4 h-4" />
        </div>
      );
    }

    if (isCredit) {
      return (
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
          <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
        </div>
      );
    }

    return (
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
        <Car className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs overflow-hidden">
      {/* ── Header with Title & Filter Pills ── */}
      <div className="p-4 sm:p-5 border-b border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
              Transaction History
            </h3>
          </div>
          <span className="text-[11px] font-bold text-gray-400">
            {filteredTransactions.length} of {transactions.length}
          </span>
        </div>

        {/* Filter Tabs (Horizontal Scroll on Mobile) */}
        <div className="w-full min-w-0 overflow-x-auto pb-0.5 scrollbar-hide -mx-1 px-1">
          <div className="inline-flex items-center gap-1.5 min-w-max">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'CREDIT', label: 'Added (+)' },
              { id: 'DEBIT', label: 'Spent (-)' },
              { id: 'PENDING', label: 'Pending' },
            ].map((t) => {
              const active = filter === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilter(t.id as any)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all border',
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Loading Skeletons ── */}
      {isLoading && (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-2xl" />
                <div className="space-y-1.5">
                  <div className="w-24 h-4 bg-gray-200 rounded" />
                  <div className="w-16 h-3 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="w-16 h-4 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {!isLoading && filteredTransactions.length === 0 && (
        <div className="py-12 px-4 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-gray-900">No transactions found</h4>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            {filter === 'ALL'
              ? 'Your wallet top-ups and ride payments will appear here in real-time.'
              : `No ${filter.toLowerCase()} transactions recorded yet.`}
          </p>
        </div>
      )}

      {/* ── Mobile & Desktop Responsive Transaction List ── */}
      {!isLoading && filteredTransactions.length > 0 && (
        <div className="divide-y divide-gray-100">
          {filteredTransactions.map((tx) => {
            const isCredit = tx.type === 'CREDIT';
            const numericAmount = Number(tx.amount) || 0;
            const refText = tx.referenceId || tx.id.slice(0, 8).toUpperCase();

            return (
              <div
                key={tx.id}
                className="p-3.5 sm:p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3"
              >
                {/* Left: Icon & Description */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getTransactionIcon(tx)}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-extrabold text-gray-900 truncate">
                      {tx.description || (isCredit ? 'Credit' : 'Debit')}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
                      <span>{formatDateTime(tx.createdAt)}</span>
                      <span className="opacity-40">•</span>
                      <span className="font-mono">#{refText}</span>
                    </p>
                  </div>
                </div>

                {/* Right: Amount & Status Badge */}
                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      'text-xs sm:text-sm font-black whitespace-nowrap leading-tight',
                      isCredit ? 'text-emerald-600' : 'text-slate-900'
                    )}
                  >
                    {isCredit ? '+' : '-'}{formatCurrency(numericAmount, tx.currency || 'INR')}
                  </p>
                  <div className="mt-1 flex justify-end">
                    {getStatusBadge(tx.status)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TransactionList;
