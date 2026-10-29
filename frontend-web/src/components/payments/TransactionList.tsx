'use client';

import React from 'react';
import { Transaction } from '@/types/payment';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isLoading = false,
}) => {
  const columns = [
    {
      key: 'type',
      header: 'Type',
      render: (tx: Transaction) => (
        <div className="flex items-center gap-2">
          {tx.type === 'CREDIT' ? (
            <div className="p-1.5 bg-green-100 rounded-full">
              <ArrowDownLeft className="w-4 h-4 text-green-600" />
            </div>
          ) : (
            <div className="p-1.5 bg-red-100 rounded-full">
              <ArrowUpRight className="w-4 h-4 text-red-600" />
            </div>
          )}
          <span className="font-medium text-gray-900">{tx.type}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (tx: Transaction) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{tx.description || 'Transaction'}</p>
          <p className="text-xs text-gray-500">{tx.referenceId || tx.id.slice(0, 8)}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (tx: Transaction) => (
        <span className={cn(
          'font-medium',
          tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
        )}>
          {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (tx: Transaction) => {
        const statusConfig = {
          PENDING: { variant: 'warning' as const, icon: <Clock className="w-3 h-3" /> },
          COMPLETED: { variant: 'success' as const, icon: <CheckCircle className="w-3 h-3" /> },
          FAILED: { variant: 'danger' as const, icon: <XCircle className="w-3 h-3" /> },
        };
        const config = statusConfig[tx.status];
        return (
          <Badge variant={config.variant} size="sm" dot>
            {tx.status}
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (tx: Transaction) => (
        <span className="text-sm text-gray-600">{formatDateTime(tx.createdAt)}</span>
      ),
    },
  ];

  return (
    <Card>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
      </div>
      <Table
        columns={columns}
        data={transactions}
        keyExtractor={(tx) => tx.id}
        isLoading={isLoading}
        emptyMessage="No transactions yet"
      />
    </Card>
  );
};

import { cn } from '@/lib/utils';

export default TransactionList;