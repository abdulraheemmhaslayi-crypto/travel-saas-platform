'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Switch from '@/components/ui/Switch';
import Loading from '@/components/common/Loading';
import {
  Percent,
  Coins,
  Clock,
  ShieldAlert,
  Save,
  RefreshCw,
  Calculator,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Calendar,
} from 'lucide-react';

interface CommissionConfig {
  commissionType: 'PERCENTAGE' | 'FIXED_PER_SEAT' | 'FIXED_PER_TRIP';
  commissionValue: number;
  deductionTiming: 'INSTANT' | 'DAILY' | 'WEEKLY';
  minWalletBalance: number;
  gracePeriodHours: number;
  autoPauseOnLowBalance: boolean;
  cancellationWindowHours: number;
  cancellationRefundPercentage: number;
}

export default function CommissionSettingsTab() {
  const { showToast } = useAppStore();
  const [config, setConfig] = useState<CommissionConfig>({
    commissionType: 'PERCENTAGE',
    commissionValue: 10,
    deductionTiming: 'INSTANT',
    minWalletBalance: 500,
    gracePeriodHours: 24,
    autoPauseOnLowBalance: false,
    cancellationWindowHours: 4,
    cancellationRefundPercentage: 90,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sandbox calculation state
  const [sampleSeatPrice, setSampleSeatPrice] = useState<number>(400);
  const [sampleSeats, setSampleSeats] = useState<number>(2);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getCommissionSettings();
      if (res?.data) {
        setConfig((prev) => ({
          ...prev,
          ...res.data,
          commissionValue: Number(res.data.commissionValue) || 10,
          minWalletBalance: Number(res.data.minWalletBalance) || 500,
          gracePeriodHours: Number(res.data.gracePeriodHours) || 24,
          cancellationWindowHours: Number(res.data.cancellationWindowHours) || 4,
          cancellationRefundPercentage: Number(res.data.cancellationRefundPercentage) || 90,
        }));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load commission settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiClient.updateCommissionSettings({
        commissionType: config.commissionType,
        commissionValue: Number(config.commissionValue),
        deductionTiming: config.deductionTiming,
        minWalletBalance: Number(config.minWalletBalance),
        gracePeriodHours: Number(config.gracePeriodHours),
        autoPauseOnLowBalance: Boolean(config.autoPauseOnLowBalance),
        cancellationWindowHours: Number(config.cancellationWindowHours),
        cancellationRefundPercentage: Number(config.cancellationRefundPercentage),
      });
      showToast('Dynamic commission & wallet rules updated and synced via Kafka!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update commission settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Live commission calculation helper
  const calculateCommission = (price: number, seats: number) => {
    const total = price * seats;
    let fee = 0;
    if (config.commissionType === 'PERCENTAGE') {
      fee = Math.round((total * config.commissionValue) / 100);
    } else if (config.commissionType === 'FIXED_PER_SEAT') {
      fee = Math.round(config.commissionValue * seats);
    } else if (config.commissionType === 'FIXED_PER_TRIP') {
      fee = Math.round(config.commissionValue);
    }
    const operatorEarnings = total - fee;
    return { total, fee, operatorEarnings };
  };

  const sampleCalc = calculateCommission(sampleSeatPrice, sampleSeats);

  if (isLoading) {
    return <Loading text="Loading dynamic commission settings..." />;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-blue-700" />
            <h2 className="text-base font-bold text-blue-900">
              Super Admin Dynamic Platform Commission & Fleet Wallet Rules
            </h2>
          </div>
          <p className="text-xs text-blue-800 leading-relaxed max-w-2xl">
            Passengers pay directly to Vehicle Owners via UPI QR (0% gateway fees). The platform fee is dynamically deducted from the Vehicle Owner’s prepaid fleet wallet with Redis locking and Kafka event synchronization.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={fetchSettings}
            disabled={isSaving}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSaving}
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Settings Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Commission Type & Value */}
          <Card className="border border-gray-200 shadow-sm p-5 sm:p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-gray-900">1. Platform Commission Mode</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Choose how platform charges are assessed on bookings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  type: 'PERCENTAGE' as const,
                  label: 'Percentage (%)',
                  desc: 'Cut % of total ticket amount',
                  icon: <Percent className="w-4 h-4 text-blue-600" />,
                },
                {
                  type: 'FIXED_PER_SEAT' as const,
                  label: 'Fixed Per Seat (₹)',
                  desc: 'Fixed ₹ per passenger seat booked',
                  icon: <Coins className="w-4 h-4 text-emerald-600" />,
                },
                {
                  type: 'FIXED_PER_TRIP' as const,
                  label: 'Fixed Per Trip (₹)',
                  desc: 'Flat ₹ per booking transaction',
                  icon: <Calendar className="w-4 h-4 text-amber-600" />,
                },
              ].map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setConfig({ ...config, commissionType: opt.type })}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    config.commissionType === opt.type
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="p-1.5 rounded-lg bg-gray-100">{opt.icon}</span>
                    {config.commissionType === opt.type && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-gray-900">{opt.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{opt.desc}</p>
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">
                  {config.commissionType === 'PERCENTAGE'
                    ? 'Commission Percentage (%)'
                    : 'Commission Fee Amount (₹)'}
                </label>
                <span className="text-base font-extrabold text-blue-600">
                  {config.commissionType === 'PERCENTAGE'
                    ? `${config.commissionValue}%`
                    : `₹${config.commissionValue}`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={config.commissionType === 'PERCENTAGE' ? 40 : 200}
                step={config.commissionType === 'PERCENTAGE' ? 0.5 : 5}
                value={config.commissionValue}
                onChange={(e) =>
                  setConfig({ ...config, commissionValue: parseFloat(e.target.value) || 0 })
                }
                className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                <span>0</span>
                <span>{config.commissionType === 'PERCENTAGE' ? '20%' : '₹100'}</span>
                <span>{config.commissionType === 'PERCENTAGE' ? '40%' : '₹200'}</span>
              </div>
            </div>
          </Card>

          {/* Card 2: Deduction Frequency & Timing */}
          <Card className="border border-gray-200 shadow-sm p-5 sm:p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-gray-900">2. Commission Deduction Timing</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                When should platform fee be deducted from the owner’s fleet wallet?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  timing: 'INSTANT' as const,
                  label: 'Instant Real-Time',
                  desc: 'Deduct immediately when owner verifies UPI payment',
                  badge: 'Recommended',
                  icon: <Zap className="w-4 h-4 text-amber-500" />,
                },
                {
                  timing: 'DAILY' as const,
                  label: 'Daily Batch',
                  desc: 'Accumulate & deduct total fees every midnight (11:59 PM)',
                  badge: 'Standard',
                  icon: <Clock className="w-4 h-4 text-blue-500" />,
                },
                {
                  timing: 'WEEKLY' as const,
                  label: 'Weekly Settlement',
                  desc: 'Deduct total fees every Sunday midnight',
                  badge: 'Bulk',
                  icon: <Calendar className="w-4 h-4 text-purple-500" />,
                },
              ].map((opt) => (
                <button
                  key={opt.timing}
                  type="button"
                  onClick={() => setConfig({ ...config, deductionTiming: opt.timing })}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    config.deductionTiming === opt.timing
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="p-1.5 rounded-lg bg-gray-100">{opt.icon}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-900">{opt.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{opt.desc}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Card 3: Fleet Wallet Threshold & Auto-Pause Rules */}
          <Card className="border border-gray-200 shadow-sm p-5 sm:p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-gray-900">3. Wallet Thresholds & Policy Enforcement</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Prevent negative balances and manage non-compliant vehicle operators.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Minimum Required Wallet Balance (₹)"
                type="number"
                min={0}
                value={config.minWalletBalance}
                onChange={(e) =>
                  setConfig({ ...config, minWalletBalance: parseInt(e.target.value) || 0 })
                }
                helperText="Operators will receive low balance warnings below this amount."
              />

              <Input
                label="Grace Period to Top-Up (Hours)"
                type="number"
                min={0}
                value={config.gracePeriodHours}
                onChange={(e) =>
                  setConfig({ ...config, gracePeriodHours: parseInt(e.target.value) || 0 })
                }
                helperText="Time given to top-up before restriction triggers."
              />
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-gray-900">Auto-Pause Trips on Low Balance</p>
                <p className="text-[11px] text-gray-500">
                  Automatically hide owner’s scheduled trips if wallet remains below minimum threshold past grace period.
                </p>
              </div>
              <Switch
                checked={config.autoPauseOnLowBalance}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, autoPauseOnLowBalance: checked })
                }
              />
            </div>
          </Card>

          {/* Card 4: Cancellation & Refund Reversal Rules */}
          <Card className="border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">4. Ride Cancellation & Platform Fee Reversal</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Fair policy: when passenger cancels and owner refunds via UPI, the Super Admin commission is 100% reversed back to owner’s wallet.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Allowed Cancellation Window (Hours before departure)"
                type="number"
                min={1}
                value={config.cancellationWindowHours}
                onChange={(e) =>
                  setConfig({ ...config, cancellationWindowHours: parseInt(e.target.value) || 1 })
                }
                helperText="Passengers can cancel up to this many hours prior to departure."
              />

              <Input
                label="Default Passenger Refund (%)"
                type="number"
                min={0}
                max={100}
                value={config.cancellationRefundPercentage}
                onChange={(e) =>
                  setConfig({ ...config, cancellationRefundPercentage: parseInt(e.target.value) || 0 })
                }
                helperText="Percentage of ticket price refunded to passenger on timely cancellation."
              />
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800 leading-relaxed">
                <strong>Zero-Penalty Guarantee for Operators:</strong> When an owner processes a cancellation refund, our backend Outbox & Kafka pipeline automatically reverses the exact platform commission charged for that ride back into the operator’s fleet wallet.
              </p>
            </div>
          </Card>
        </div>

        {/* Right 1 Column: Interactive Calculation Sandbox */}
        <div className="space-y-6">
          <Card className="border border-blue-200 bg-gradient-to-b from-white to-blue-50/40 shadow-sm p-5 space-y-5 sticky top-20">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Calculator className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-gray-900">Live Fee Sandbox</h3>
                <p className="text-[11px] text-gray-500">Test how current rules affect a real booking</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700">Ticket Price Per Seat (₹)</label>
                <input
                  type="number"
                  min={50}
                  step={50}
                  value={sampleSeatPrice}
                  onChange={(e) => setSampleSeatPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full mt-1 px-3 py-1.5 text-sm font-bold border border-gray-200 rounded-lg"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700">Passenger Seats Booked</label>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3, 4, 6].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSampleSeats(s)}
                      className={`flex-1 py-1 text-xs font-bold rounded-lg border transition-all ${
                        sampleSeats === s
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sandbox Breakdown Results */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-xs">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Passenger Direct UPI Payment:</span>
                <span className="font-extrabold text-gray-900">₹{sampleCalc.total}</span>
              </div>
              <p className="text-[10px] text-emerald-600 font-medium">
                ↳ 100% credited directly into Vehicle Owner’s Bank/UPI Account
              </p>

              <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between text-xs">
                <span className="text-blue-700 font-bold">Super Admin Platform Fee:</span>
                <span className="font-extrabold text-blue-700">-₹{sampleCalc.fee}</span>
              </div>
              <p className="text-[10px] text-blue-600 font-medium">
                ↳ Auto-debited from Vehicle Owner’s Fleet Wallet ({config.deductionTiming})
              </p>

              <div className="pt-2 border-t border-gray-200 flex justify-between text-sm">
                <span className="font-bold text-gray-900">Owner Net Earnings:</span>
                <span className="font-extrabold text-emerald-700">₹{sampleCalc.operatorEarnings}</span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-1.5" />
              {isSaving ? 'Saving Rules...' : 'Save & Publish to Kafka'}
            </Button>
          </Card>
        </div>
      </div>
    </form>
  );
}
