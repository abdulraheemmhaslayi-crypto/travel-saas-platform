'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Menu,
  Bell,
  MapPin,
  RefreshCw,
  Download,
  BarChart3,
  Receipt,
  TrendingUp,
  Calendar,
  Clock,
  Coins,
  Trophy,
  DollarSign,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  IndianRupee,
  HelpCircle,
  Car,
  Users,
  User,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
} from 'recharts';
import { cn } from '@/lib/utils';

export type EarningsTab = 'revenue' | 'payouts' | 'commission';

export interface FleetEarningsMobileProps {
  user: any;
  unreadCount: number;
  revenue: any;
  wallet: any;
  transactions: any[];
  bookings: any[];
  activeTab: EarningsTab;
  onTabChange: (tab: EarningsTab) => void;
  isLoading: boolean;
  onRefresh: () => void;
  onRequestPayout: () => void;
  onExportReport?: () => void;
}

export default function FleetEarningsMobile({
  user,
  unreadCount,
  revenue,
  wallet,
  transactions,
  bookings,
  activeTab,
  onTabChange,
  isLoading,
  onRefresh,
  onRequestPayout,
  onExportReport,
}: FleetEarningsMobileProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // User initials for top avatar (e.g. "RS")
  const initials = useMemo(() => {
    const f = user?.firstName?.[0] || 'R';
    const l = user?.lastName?.[0] || 'S';
    return `${f}${l}`.toUpperCase();
  }, [user]);

  // Tabs List matching screenshot
  const tabsList: { id: EarningsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'revenue', label: 'Revenue Reports', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'payouts', label: 'Payout History', icon: <Receipt className="w-3.5 h-3.5" /> },
    { id: 'commission', label: 'Commission Reports', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  ];

  // Rolling 7 days ending today (e.g. Wed, Thu, Fri, Sat, Sun, Mon, Tue)
  const last7Days = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push(days[d.getDay()]);
    }
    return list;
  }, []);

  // Real Weekly Revenue Trend Data
  const trendData = useMemo(() => {
    if (revenue?.weeklyTrend && Array.isArray(revenue.weeklyTrend) && revenue.weeklyTrend.length > 0) {
      return revenue.weeklyTrend;
    }
    return last7Days.map((day) => ({
      name: day,
      revenue: 0,
    }));
  }, [revenue, last7Days]);

  // Top Performing Vehicles Data
  const vehicleData = useMemo(() => {
    if (revenue?.topVehicles && Array.isArray(revenue.topVehicles) && revenue.topVehicles.length > 0) {
      return revenue.topVehicles;
    }
    return [{ name: 'Toyota Innova', revenue: 0 }];
  }, [revenue]);

  // Commission Calculations
  const activeBookings = useMemo(() => {
    return bookings.filter(
      (b) => (b.status || '').toUpperCase() === 'CONFIRMED' || (b.status || '').toUpperCase() === 'COMPLETED'
    );
  }, [bookings]);

  const totalGrossFare = useMemo(() => {
    return activeBookings.reduce((sum, b) => sum + Number(b.totalAmount || b.amount || 0), 0);
  }, [activeBookings]);

  const totalCommissionDeducted = totalGrossFare * 0.12;
  const netFleetShare = totalGrossFare * 0.88;

  // Payouts Calculations
  const completedPayoutsTotal = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'DEBIT' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const pendingPayoutsTotal = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'DEBIT' && t.status === 'PENDING')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const payoutHistoryList = useMemo(() => {
    return transactions.filter((t) => t.type === 'DEBIT');
  }, [transactions]);

  // Default export action
  const handleExport = () => {
    if (onExportReport) {
      onExportReport();
      return;
    }
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Metric,Amount']
        .concat([
          `Today Revenue,${revenue?.today || 0}`,
          `This Week Revenue,${revenue?.thisWeek || 0}`,
          `This Month Revenue,${revenue?.thisMonth || 0}`,
          `Total Lifetime Revenue,${revenue?.total || 0}`,
          `Withdrawable Balance,${wallet?.balance || 0}`,
          `Gross Fare,${totalGrossFare}`,
          `Platform Fee (12%),${totalCommissionDeducted}`,
          `Net Fleet Share,${netFleetShare}`,
        ])
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fleet_earnings_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] pb-24 text-slate-800 antialiased selection:bg-[#4F46E5] selection:text-white">
      {/* ─── Top Header Bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-1.5 -ml-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 text-slate-800" />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-[#4F46E5] flex items-center justify-center text-white shadow-xs">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900">
              Kokan Travel
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/notifications"
            className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 ? (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </Link>

          <Link
            href="/dashboard/profile"
            className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors shadow-xs"
          >
            {initials}
          </Link>
        </div>
      </header>

      {/* ─── Main Content Container ────────────────────────────────── */}
      <main className="p-4 space-y-3.5 max-w-lg mx-auto">
        {/* ── 1. Gradient Banner Card with Coins Icon & Bus Graphic ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#4F46E5] via-[#5B50E6] to-[#7C3AED] p-4 text-white shadow-sm border border-indigo-500/20">
          <div className="relative z-10 max-w-[65%] space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                <Coins className="w-4 h-4" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
                Earnings Overview
              </h1>
            </div>
            <p className="text-[11px] text-indigo-100/90 leading-relaxed font-normal pt-0.5">
              Track your fleet's revenue, platform fees, and bank transfers.
            </p>
          </div>

                    {/* Decorative Modern Car Graphic */}
          <div className="absolute -right-2 bottom-0 opacity-95 pointer-events-none">
            <div className="relative w-32 h-14 flex items-end justify-end">
              <img
                src="/images/banner-car.png"
                alt="Fleet Vehicle"
                className="w-auto h-full max-h-13 object-contain drop-shadow-md"
              />
            </div>
          </div>
        </div>

        {/* ── 2. Action Buttons: Refresh & Export Report ─────────────── */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-slate-700 text-xs font-semibold hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-slate-600', isLoading && 'animate-spin')} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#16A34A] text-white shadow-2xs text-xs font-semibold hover:bg-[#15803D] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>

        {/* ── 3. Pill Tabs Row (Matching Screenshot) ────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
          {tabsList.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shadow-2xs cursor-pointer',
                  isSelected
                    ? 'bg-[#EEF2FF] text-[#4F46E5] border border-indigo-200/80 font-bold'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── 4. Tab 1 Content: REVENUE REPORTS (Matching Screenshot) ── */}
        {activeTab === 'revenue' && (
          <div className="space-y-3.5">
            {/* 4 Stat Cards in 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Card 1: TODAY'S REVENUE */}
              <div className="bg-[#F0FDF4] rounded-2xl p-3.5 border border-emerald-100 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    TODAY'S REVENUE
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 leading-tight">
                  ₹{(revenue?.today || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] font-medium text-emerald-600 flex items-center gap-1 pt-0.5">
                  <TrendingUp className="w-3 h-3 shrink-0" />
                  <span>Live from database</span>
                </p>
              </div>

              {/* Card 2: THIS WEEK */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    THIS WEEK
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 leading-tight">
                  ₹{(revenue?.thisWeek || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1 pt-0.5">
                  <TrendingUp className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Aggregated from trips</span>
                </p>
              </div>

              {/* Card 3: THIS MONTH */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    THIS MONTH
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 leading-tight">
                  ₹{(revenue?.thisMonth || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] font-medium text-purple-600 flex items-center gap-1 pt-0.5">
                  <TrendingUp className="w-3 h-3 shrink-0" />
                  <span>Active billing month</span>
                </p>
              </div>

              {/* Card 4: TOTAL REVENUE */}
              <div className="bg-[#FFFBEB] rounded-2xl p-3.5 border border-amber-100 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    TOTAL REVENUE
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 leading-tight">
                  ₹{(revenue?.total || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] font-medium text-amber-700 flex items-center gap-1 pt-0.5">
                  <TrendingUp className="w-3 h-3 shrink-0" />
                  <span>Lifetime earnings</span>
                </p>
              </div>
            </div>

            {/* ── 5. Revenue Trend (This Week) Card ──────────────────── */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#4F46E5]" />
                <h2 className="text-sm font-bold text-slate-900">Revenue Trend (This Week)</h2>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="name"
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                      dy={6}
                    />
                    <YAxis
                      width={54}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(val === 0 ? 0 : 3)}k`}
                      domain={[0, (dataMax: number) => Math.max(dataMax * 1.2, 4)]}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                      formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                    />
                    <Line
                      type="linear"
                      dataKey="revenue"
                      stroke="#16A34A"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#FFFFFF', stroke: '#16A34A', strokeWidth: 2.5 }}
                      activeDot={{ r: 6, fill: '#16A34A', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── 6. Top Performing Vehicles Card ───────────────────── */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#4F46E5]" />
                <h2 className="text-sm font-bold text-slate-900">Top Performing Vehicles</h2>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={vehicleData}
                    layout="vertical"
                    margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis
                      type="number"
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(val === 0 ? 0 : 3)}k`}
                      domain={[0, (dataMax: number) => Math.max(dataMax * 1.2, 4)]}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                      width={86}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                      formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. Tab 2 Content: PAYOUT HISTORY ──────────────────────── */}
        {activeTab === 'payouts' && (
          <div className="space-y-3.5">
            {/* Withdrawable Balance Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    WITHDRAWABLE BALANCE
                  </span>
                  <p className="text-2xl font-bold text-slate-900 mt-0.5">
                    ₹{(wallet?.balance || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  onClick={onRequestPayout}
                  className="px-3.5 py-2 rounded-xl bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D] active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Withdraw</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">TOTAL PAID OUT</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    ₹{completedPayoutsTotal.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">PENDING</p>
                  <p className="text-xs font-bold text-amber-600 mt-0.5">
                    ₹{pendingPayoutsTotal.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>

            {/* Payouts List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-slate-900">Transfer History</h3>
                <span className="text-xs text-slate-400 font-medium">
                  {payoutHistoryList.length} records
                </span>
              </div>

              {payoutHistoryList.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-2xs space-y-2">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No payout requests yet</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    When you request bank transfers from your wallet, transaction details will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {payoutHistoryList.map((payout) => {
                    const isCompleted = (payout.status || '').toUpperCase() === 'COMPLETED';
                    return (
                      <div
                        key={payout.id}
                        className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {payout.description || `Transfer to Bank`}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {new Date(payout.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-slate-900">
                            -₹{Number(payout.amount || 0).toLocaleString('en-IN')}
                          </p>
                          <span
                            className={cn(
                              'inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mt-0.5',
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            )}
                          >
                            {payout.status || 'Pending'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 6. Tab 3 Content: COMMISSION REPORTS ──────────────────── */}
        {activeTab === 'commission' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs">
                <p className="text-[9px] font-semibold text-slate-400 uppercase">GROSS FARE</p>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  ₹{totalGrossFare.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-rose-50/60 rounded-2xl p-3 border border-rose-100 shadow-2xs">
                <p className="text-[9px] font-semibold text-rose-500 uppercase">FEE (12%)</p>
                <p className="text-sm font-bold text-rose-700 mt-1">
                  ₹{totalCommissionDeducted.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-emerald-50/60 rounded-2xl p-3 border border-emerald-100 shadow-2xs">
                <p className="text-[9px] font-semibold text-emerald-600 uppercase">NET (88%)</p>
                <p className="text-sm font-bold text-emerald-700 mt-1">
                  ₹{netFleetShare.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-slate-900">Trips Commission Breakdown</h3>
                <span className="text-xs text-slate-400 font-medium">
                  {activeBookings.length} bookings
                </span>
              </div>

              {activeBookings.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-2xs space-y-2">
                  <BarChart3 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No completed bookings yet</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Commission deductions will be automatically calculated as passengers book trips.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeBookings.map((b) => {
                    const fare = Number(b.totalAmount || b.amount || 0);
                    const fee = fare * 0.12;
                    const net = fare * 0.88;
                    return (
                      <div
                        key={b.id}
                        className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-slate-800">
                            ID: {String(b.id || '').split('-')[0].toUpperCase()}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {new Date(b.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-xl text-center text-xs">
                          <div>
                            <span className="text-[9px] text-slate-400 font-medium block">Fare</span>
                            <span className="font-bold text-slate-800">₹{fare}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-rose-500 font-medium block">12% Fee</span>
                            <span className="font-bold text-rose-600">-₹{fee.toFixed(0)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-emerald-600 font-medium block">Net Share</span>
                            <span className="font-bold text-emerald-700">₹{net.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ─── Slide-over Drawer Menu ─────────────────────────────────── */}
      {isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 animate-in fade-in duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed top-0 bottom-0 left-0 w-[280px] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#4F46E5] flex items-center justify-center text-white">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="font-bold text-base text-slate-900">Kokan Travel</span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#4F46E5] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Fleet Owner'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || 'fleet@kokan.com'}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1 text-xs font-semibold text-slate-700">
              <Link
                href="/dashboard/fleet-owner"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Dashboard Overview</span>
              </Link>
              <Link
                href="/dashboard/fleet-owner/trips"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Manage Trips</span>
              </Link>
              <Link
                href="/dashboard/fleet-owner/vehicles"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Car className="w-4 h-4 text-slate-500" />
                <span>Fleet Vehicles</span>
              </Link>
              <Link
                href="/dashboard/fleet-owner/drivers"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Users className="w-4 h-4 text-slate-500" />
                <span>Driver Management</span>
              </Link>
              <Link
                href="/dashboard/fleet-owner/earnings"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-50 text-[#4F46E5] font-bold"
              >
                <IndianRupee className="w-4 h-4 text-[#4F46E5]" />
                <span>Earnings & Reports</span>
              </Link>
              <Link
                href="/dashboard/support"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <span>Support Tickets</span>
              </Link>
              <Link
                href="/dashboard/profile"
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>Account Profile & KYC</span>
              </Link>
            </div>

            <div className="p-3 border-t border-slate-100 text-center text-[10px] text-slate-400 font-semibold">
              Kokan Travel Operator Portal v2.0
            </div>
          </div>
        </>
      )}
    </div>
  );
}
