'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Bell,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Activity,
} from 'lucide-react';
import apiClient from '@/lib/api';

export default function DriverSettingsPage() {
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [prefNotification, setPrefNotification] = useState({
    tripUpdates: true,
    bookingAlerts: true,
    paymentAlerts: true,
    systemAlerts: false,
  });

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setSuccessMsg('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to change password. Please verify current password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreferenceChange = (key: keyof typeof prefNotification) => {
    setPrefNotification(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Settings</h1>
          <p className="text-sm text-gray-500">Configure your account preferences and security options</p>
        </div>

        {/* Availability Switch */}
        <Card className="p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            Duty Availability
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Online Availability status</p>
              <p className="text-xs text-gray-500 mt-0.5">Toggle whether you are available to receive new trip assignments.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={onlineStatus}
                onChange={() => setOnlineStatus(!onlineStatus)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </Card>

        {/* Notification Preferences */}
        <Card className="p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-500" />
            Push Notification Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-55 pb-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Trip Updates</p>
                <p className="text-xs text-gray-500 mt-0.5">Notifications when assigned trips start, finish, or change stops.</p>
              </div>
              <input
                type="checkbox"
                checked={prefNotification.tripUpdates}
                onChange={() => handlePreferenceChange('tripUpdates')}
                className="w-4.5 h-4.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between border-b border-gray-55 pb-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Booking Requests</p>
                <p className="text-xs text-gray-500 mt-0.5">Notifications for new seat bookings or passenger boarding.</p>
              </div>
              <input
                type="checkbox"
                checked={prefNotification.bookingAlerts}
                onChange={() => handlePreferenceChange('bookingAlerts')}
                className="w-4.5 h-4.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between border-b border-gray-55 pb-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Payment Alerts</p>
                <p className="text-xs text-gray-500 mt-0.5">Notifications for payout transfers and transaction confirmations.</p>
              </div>
              <input
                type="checkbox"
                checked={prefNotification.paymentAlerts}
                onChange={() => handlePreferenceChange('paymentAlerts')}
                className="w-4.5 h-4.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </div>
          </div>
        </Card>

        {/* Change Password */}
        <Card className="p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-500" />
            Security & Credentials
          </h3>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Current Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password (min 8 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold"
              >
                {isSubmitting ? 'Updating Password...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
