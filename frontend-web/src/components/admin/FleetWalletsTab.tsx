'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import {
  Wallet,
  Coins,
  AlertTriangle,
  CheckCircle2,
  Search,
  RefreshCw,
  QrCode,
  Truck,
  ArrowUpRight,
  User,
  Phone,
  Mail,
  ShieldAlert,
} from 'lucide-react';

interface FleetWalletItem {
  userId: string;
  name: string;
  email: string;
  phone: string;
  userType: string;
  upiId?: string;
  upiAccountName?: string;
  walletBalance: number;
  totalCredited: number;
  totalDebited: number;
  vehicleCount: number;
  isLowBalance: boolean;
  minRequiredBalance: number;
  status: 'COMPLIANT' | 'LOW_BALANCE';
}

export default function FleetWalletsTab() {
  const { showToast } = useAppStore();
  const [wallets, setWallets] = useState<FleetWalletItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'COMPLIANT' | 'LOW_BALANCE'>('ALL');

  const loadWallets = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getFleetWallets();
      setWallets(res.data?.data || res.data || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load fleet wallets', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const filteredWallets = wallets.filter((w) => {
    const matchesSearch =
      (w.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.phone || '').includes(searchQuery) ||
      (w.upiId || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === 'COMPLIANT') return !w.isLowBalance;
    if (filterStatus === 'LOW_BALANCE') return w.isLowBalance;
    return true;
  });

  // Aggregate stats
  const totalOperators = wallets.length;
  const totalFleetBalance = wallets.reduce((acc, w) => acc + (w.walletBalance || 0), 0);
  const totalPlatformFeesCollected = wallets.reduce((acc, w) => acc + (w.totalDebited || 0), 0);
  const lowBalanceCount = wallets.filter((w) => w.isLowBalance).length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-sm p-4 bg-white">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fleet Operators</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-2xl font-bold text-gray-900">{totalOperators}</p>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <User className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="border border-gray-200 shadow-sm p-4 bg-white">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Prepaid Balance</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-2xl font-bold text-gray-900">₹{totalFleetBalance.toLocaleString('en-IN')}</p>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="border border-gray-200 shadow-sm p-4 bg-white">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total Commission Debited</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-2xl font-bold text-blue-700">₹{totalPlatformFeesCollected.toLocaleString('en-IN')}</p>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Coins className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="border border-gray-200 shadow-sm p-4 bg-white">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Low Balance Alerts</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-2xl font-bold text-amber-700">{lowBalanceCount}</p>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 border border-gray-200 rounded-2xl shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by operator name, phone, email, or UPI ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'COMPLIANT', 'LOW_BALANCE'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                filterStatus === status
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              {status === 'ALL'
                ? 'All Operators'
                : status === 'COMPLIANT'
                ? 'Compliant'
                : 'Low Balance'}
            </button>
          ))}

          <Button variant="secondary" size="sm" onClick={loadWallets}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Wallets Table */}
      {isLoading ? (
        <Loading text="Loading fleet operator wallets..." />
      ) : filteredWallets.length === 0 ? (
        <EmptyState
          title="No fleet wallets found"
          description="No vehicle owners match your query or filter criteria."
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="py-3 px-4">Operator / Fleet Owner</th>
                  <th className="py-3 px-4">Direct UPI Account</th>
                  <th className="py-3 px-4">Fleet Size</th>
                  <th className="py-3 px-4">Wallet Balance</th>
                  <th className="py-3 px-4">Total Commission Debited</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredWallets.map((item) => (
                  <tr key={item.userId} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          <span className="flex items-center gap-1 font-mono">{item.phone || 'No phone'}</span>
                          <span>•</span>
                          <span>{item.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {item.upiId ? (
                        <div>
                          <p className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded inline-block">
                            {item.upiId}
                          </p>
                          {item.upiAccountName && (
                            <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[160px]">
                              {item.upiAccountName}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Not configured</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        <Truck className="w-3 h-3 text-gray-500" />
                        {item.vehicleCount || 0} {item.vehicleCount === 1 ? 'Vehicle' : 'Vehicles'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p
                        className={`text-sm font-extrabold ${
                          item.isLowBalance ? 'text-red-600' : 'text-emerald-700'
                        }`}
                      >
                        ₹{item.walletBalance.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                        Min req: ₹{item.minRequiredBalance || 500}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-sm font-extrabold text-blue-700">
                        ₹{item.totalDebited.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                        Total credited: ₹{item.totalCredited.toLocaleString('en-IN')}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      {item.isLowBalance ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Low Balance
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Compliant
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
