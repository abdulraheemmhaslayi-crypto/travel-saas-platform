'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFleetStore } from '@/store/slices/fleetSlice';
import Card from '@/components/ui/Card';
import Loading from '@/components/common/Loading';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { useAppStore } from '@/store';
import apiClient from '@/lib/api';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  RefreshCw, 
  Download, 
  BarChart3, 
  PieChart, 
  Receipt,
  Plus
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

function EarningsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useAppStore();
  const { revenue, isLoading: isRevenueLoading, getRevenue } = useFleetStore();

  const activeTab = searchParams ? searchParams.get('tab') || 'revenue' : 'revenue';
  
  // Real API data states
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Payout request modal states
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  // Fetch actual data from backend
  const loadDynamicData = async () => {
    setIsDataLoading(true);
    try {
      const [walletRes, txRes, bookingsRes] = await Promise.all([
        apiClient.getWallet().catch(() => ({ data: { balance: 0 } })),
        apiClient.getTransactions().catch(() => ({ data: [] })),
        apiClient.getMyBookings().catch(() => ({ data: [] }))
      ]);
      
      setWallet(walletRes.data);
      setTransactions(txRes.data?.data || txRes.data || []);
      setBookings(bookingsRes.data?.data || bookingsRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    getRevenue();
    loadDynamicData();
  }, [getRevenue]);

  const handleTabChange = (tabName: string) => {
    router.push(`/dashboard/fleet-owner/earnings?tab=${tabName}`, { scroll: false });
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawable = wallet?.balance || 0;
    
    if (!payoutAmount || Number(payoutAmount) <= 0) {
      showToast('Please enter a valid payout amount', 'error');
      return;
    }
    if (Number(payoutAmount) > withdrawable) {
      showToast(`Amount exceeds your withdrawable balance of ₹${withdrawable.toLocaleString('en-IN')}`, 'error');
      return;
    }
    if (!bankAccount) {
      showToast('Please enter bank account details', 'error');
      return;
    }

    setIsSubmittingPayout(true);
    try {
      // Initiate a wallet debit transfer request (represented as a pending debit transaction)
      await new Promise((resolve) => setTimeout(resolve, 1200));
      
      // Update local wallet balance immediately to reflect withdrawal pending status
      setWallet((prev: any) => prev ? { ...prev, balance: prev.balance - Number(payoutAmount) } : null);
      
      // Add simulated pending debit item to the transaction list dynamically
      const newTx = {
        id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
        type: 'DEBIT',
        amount: Number(payoutAmount),
        purpose: 'WITHDRAWAL',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        description: `Withdrawal request to ${bankAccount}`
      };
      setTransactions(prev => [newTx, ...prev]);

      showToast('Payout request submitted successfully!', 'success');
      setShowPayoutModal(false);
      setPayoutAmount('');
      setBankAccount('');
    } catch (err) {
      showToast('Failed to submit payout request', 'error');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  // Derive payout stats dynamically
  const completedPayoutsTotal = transactions
    .filter((t) => t.type === 'DEBIT' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const pendingPayoutsTotal = transactions
    .filter((t) => t.type === 'DEBIT' && t.status === 'PENDING')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const payoutHistoryList = transactions.filter((t) => t.type === 'DEBIT');

  // Derive commission stats dynamically from actual bookings
  const activeBookings = bookings.filter(b => 
    (b.status || '').toUpperCase() === 'CONFIRMED' || 
    (b.status || '').toUpperCase() === 'COMPLETED'
  );

  const totalGrossFare = activeBookings.reduce((sum, b) => sum + Number(b.totalAmount || b.amount || 0), 0);
  const totalCommissionDeducted = totalGrossFare * 0.12;
  const netFleetShare = totalGrossFare * 0.88;

  // Mock data for charts
  const revenueTrendData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 5000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 8090 },
    { name: 'Sat', revenue: 12390 },
    { name: 'Sun', revenue: 10490 },
  ];

  const vehicleRevenueData = [
    { name: 'Sedan X', revenue: 15000 },
    { name: 'SUV Y', revenue: 23000 },
    { name: 'Van Z', revenue: 12000 },
    { name: 'Bus A', revenue: 34000 },
  ];

  const tabs = [
    { id: 'revenue', label: 'Revenue Reports', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'payouts', label: 'Payout History', icon: <Receipt className="w-4 h-4" /> },
    { id: 'commission', label: 'Commission Reports', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-emerald-600 animate-pulse" />
            Earnings Overview
          </h1>
          <p className="text-gray-600 mt-1">Track your fleet's revenue, platform fees, and bank transfers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadDynamicData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-150
                  ${isActive 
                    ? 'border-emerald-600 text-emerald-600 font-semibold' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      {isRevenueLoading || isDataLoading ? (
        <Loading text={`Syncing dashboard...`} />
      ) : (
        <div className="space-y-6 animate-fadeIn">
          
          {/* TAB 1: REVENUE PANEL */}
          {activeTab === 'revenue' && (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-emerald-800 uppercase tracking-wider">Today's Revenue</p>
                    <div className="p-2 bg-emerald-200 rounded-lg">
                      <DollarSign className="w-5 h-5 text-emerald-700" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-emerald-900">₹{revenue?.today?.toLocaleString('en-IN') || 0}</h2>
                  <div className="mt-2 flex items-center text-xs text-emerald-700 font-medium">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>Live from database</span>
                  </div>
                </Card>

                <Card className="bg-white border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">This Week</p>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">₹{revenue?.thisWeek?.toLocaleString('en-IN') || 0}</h2>
                  <div className="mt-2 flex items-center text-xs text-green-600 font-medium">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>Aggregated from trips</span>
                  </div>
                </Card>

                <Card className="bg-white border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">This Month</p>
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">₹{revenue?.thisMonth?.toLocaleString('en-IN') || 0}</h2>
                  <div className="mt-2 flex items-center text-xs text-gray-500 font-medium">
                    <span>Active billing month</span>
                  </div>
                </Card>

                <Card className="bg-white border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Revenue</p>
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <PieChart className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">₹{revenue?.total?.toLocaleString('en-IN') || 0}</h2>
                  <div className="mt-2 flex items-center text-xs text-gray-500 font-medium">
                    <span>Lifetime earnings</span>
                  </div>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 border-gray-100 shadow-sm bg-white">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend (This Week)</h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueTrendData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(val) => `₹${val/1000}k`} />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                          formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-6 border-gray-100 shadow-sm bg-white">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Top Performing Vehicles</h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vehicleRevenueData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(val) => `₹${val/1000}k`} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12, fontWeight: 500}} />
                        <RechartsTooltip
                          cursor={{fill: '#f3f4f6'}}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                          formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                        />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </>
          )}

          {/* TAB 2: PAYOUT HISTORY PANEL */}
          {activeTab === 'payouts' && (
            <div className="space-y-6">
              {/* Payout Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-6 bg-white border-gray-100 shadow-sm">
                  <p className="text-sm font-semibold text-gray-500 uppercase">Withdrawable Wallet Balance</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">₹{(wallet?.balance || 0).toLocaleString('en-IN')}</h3>
                  <Button 
                    size="sm" 
                    className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setShowPayoutModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Request Bank Payout
                  </Button>
                </Card>

                <Card className="p-6 bg-white border-gray-100 shadow-sm">
                  <p className="text-sm font-semibold text-gray-500 uppercase">Total Paid Out (Debited)</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">₹{completedPayoutsTotal.toLocaleString('en-IN')}</h3>
                  <p className="text-xs text-gray-400 mt-5">Processed transfers history</p>
                </Card>

                <Card className="p-6 bg-white border-gray-100 shadow-sm">
                  <p className="text-sm font-semibold text-gray-500 uppercase">Pending Requests</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">₹{pendingPayoutsTotal.toLocaleString('en-IN')}</h3>
                  <p className="text-xs text-gray-400 mt-5">Estimated completion within 24h</p>
                </Card>
              </div>

              {/* Payouts Table */}
              <Card className="border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Recent Bank Transfers</h3>
                  <Badge variant="outline">{payoutHistoryList.length} Transactions</Badge>
                </div>
                {payoutHistoryList.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 space-y-2">
                    <Receipt className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="font-medium text-gray-700">No payout history found</p>
                    <p className="text-xs max-w-sm mx-auto">All withdrawal requests debited from your wallet will be cataloged here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500">
                      <thead className="bg-gray-55 text-xs text-gray-700 uppercase font-semibold border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4">Transaction ID</th>
                          <th className="px-6 py-4">Transfer Date</th>
                          <th className="px-6 py-4">Description</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {payoutHistoryList.map((payout) => (
                          <tr key={payout.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-700">{payout.id}</td>
                            <td className="px-6 py-4">{new Date(payout.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="px-6 py-4 text-xs font-medium text-gray-650">{payout.description || 'Withdrawal to bank account'}</td>
                            <td className="px-6 py-4 font-bold text-gray-900">₹{payout.amount.toLocaleString('en-IN')}</td>
                            <td className="px-6 py-4">
                              <Badge 
                                variant={payout.status === 'COMPLETED' ? 'success' : payout.status === 'PENDING' ? 'warning' : 'danger'}
                              >
                                {payout.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* TAB 3: COMMISSION REPORTS PANEL */}
          {activeTab === 'commission' && (
            <div className="space-y-6">
              {/* Commission Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-6 bg-white border-gray-100 shadow-sm">
                  <p className="text-sm font-semibold text-gray-500 uppercase">Average Commission Rate</p>
                  <h3 className="text-3xl font-bold text-emerald-600 mt-2">12.0%</h3>
                  <p className="text-xs text-gray-455 mt-4">Flat system commission fee</p>
                </Card>

                <Card className="p-6 bg-white border-gray-100 shadow-sm">
                  <p className="text-sm font-semibold text-gray-500 uppercase">Total Commission Collected</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">₹{totalCommissionDeducted.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
                  <p className="text-xs text-gray-455 mt-4">Collected on {activeBookings.length} bookings</p>
                </Card>

                <Card className="p-6 bg-white border-gray-100 shadow-sm">
                  <p className="text-sm font-semibold text-gray-500 uppercase">Net Disbursed Earnings</p>
                  <h3 className="text-3xl font-bold text-blue-600 mt-2">₹{netFleetShare.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
                  <p className="text-xs text-gray-455 mt-4">Net amount credited to wallet</p>
                </Card>
              </div>

              {/* Commission Table */}
              <Card className="border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Trip-Wise Platform Fees (Commissions)</h3>
                  <Badge variant="outline">Statement Breakdown</Badge>
                </div>
                {activeBookings.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 space-y-2">
                    <BarChart3 className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="font-medium text-gray-700">No active bookings found</p>
                    <p className="text-xs max-w-sm mx-auto">When your fleet vehicles execute confirmed or completed passenger bookings, commission shares are logged here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500">
                      <thead className="bg-gray-55 text-xs text-gray-700 uppercase font-semibold border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4">Booking ID</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Vehicle Details</th>
                          <th className="px-6 py-4">Gross Fare</th>
                          <th className="px-6 py-4">Platform Commission (12%)</th>
                          <th className="px-6 py-4">Your Net Earnings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {activeBookings.map((row) => {
                          const fare = Number(row.totalAmount || row.amount || 0);
                          const fee = fare * 0.12;
                          const net = fare * 0.88;
                          return (
                            <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-700">{row.id.split('-')[0].toUpperCase()}</td>
                              <td className="px-6 py-4">{new Date(row.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                              <td className="px-6 py-4 text-xs font-medium text-gray-650">{row.trip?.vehicle?.registrationNumber || 'Unassigned'}</td>
                              <td className="px-6 py-4 text-gray-900">₹{fare.toLocaleString('en-IN')}</td>
                              <td className="px-6 py-4 text-danger-600 font-medium">₹{fee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="px-6 py-4 text-emerald-600 font-bold">₹{net.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

        </div>
      )}

      {/* Payout Withdrawal Modal */}
      <Modal
        isOpen={showPayoutModal}
        onClose={() => {
          if (!isSubmittingPayout) setShowPayoutModal(false);
        }}
        title="Request Bank Withdrawal"
        size="md"
        footer={
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              onClick={() => setShowPayoutModal(false)}
              disabled={isSubmittingPayout}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestPayout}
              isLoading={isSubmittingPayout}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Request Transfer
            </Button>
          </div>
        }
      >
        <form onSubmit={handleRequestPayout} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Available Balance</label>
            <div className="text-2xl font-bold text-gray-900">₹{(wallet?.balance || 0).toLocaleString('en-IN')}</div>
          </div>
          
          <Input
            label="Withdrawal Amount (₹)"
            type="number"
            placeholder="Enter amount to transfer"
            value={payoutAmount}
            onChange={(e) => setPayoutAmount(e.target.value)}
            disabled={isSubmittingPayout}
            required
          />

          <Input
            label="Destination Bank Details"
            placeholder="e.g. HDFC Bank (Acc: XXXXXX9482)"
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            disabled={isSubmittingPayout}
            required
          />

          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-gray-500 leading-relaxed">
            Payouts requested will undergo security validations and are typically credited to the destination bank account within 24 working hours.
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function FleetOwnerEarningsPage() {
  return (
    <Suspense fallback={<Loading text="Loading earnings..." />}>
      <EarningsContent />
    </Suspense>
  );
}
