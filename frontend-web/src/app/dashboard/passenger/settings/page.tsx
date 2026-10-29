'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useNotificationStore } from '@/store/slices/notificationSlice';
import { useAuthStore } from '@/store/slices/authSlice';
import { useAppStore } from '@/store';
import apiClient from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Switch from '@/components/ui/Switch';
import Select from '@/components/ui/Select';
import Loading from '@/components/common/Loading';
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  Shield,
  Eye,
  EyeOff,
  History as HistoryIcon,
  Languages,
} from 'lucide-react';

export default function SettingsPage() {
  const { showToast } = useAppStore();
  const { preferences, getPreferences, updatePreferences } = useNotificationStore();
  const { user, setUser } = useAuthStore();
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  // Regional state
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [isSavingLang, setIsSavingLang] = useState(false);

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState({
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    bookingAlerts: true,
    paymentAlerts: true,
    tripUpdates: true,
    promotionalEmails: false,
    supportReplies: true,
  });

  useEffect(() => {
    getPreferences().then(() => setIsLoadingPrefs(false));
  }, [getPreferences]);

  useEffect(() => {
    if (preferences) {
      setNotifPrefs({
        emailEnabled: preferences.emailEnabled ?? true,
        pushEnabled: preferences.pushEnabled ?? true,
        smsEnabled: preferences.smsEnabled ?? false,
        bookingAlerts: preferences.bookingAlerts ?? true,
        paymentAlerts: preferences.paymentAlerts ?? true,
        tripUpdates: preferences.tripUpdates ?? true,
        promotionalEmails: preferences.promotionalEmails ?? false,
        supportReplies: preferences.supportReplies ?? true,
      });
    }
  }, [preferences]);

  useEffect(() => {
    if (user?.preferredLanguage) {
      setPreferredLanguage(user.preferredLanguage);
    }
  }, [user]);

  const handleToggle = async (key: string, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    try {
      await updatePreferences(updated);
      showToast('Notification preferences updated successfully.', 'success');
    } catch {
      // Revert on failure
      setNotifPrefs(notifPrefs);
      showToast('Failed to update preference', 'error');
    }
  };

  const handleSaveLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLang(true);
    try {
      const res = await apiClient.updateProfile({ preferredLanguage });
      setUser(res.data);
      showToast('Language preferences updated successfully!', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update language';
      showToast(message, 'error');
    } finally {
      setIsSavingLang(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiClient.changePassword({ currentPassword, newPassword });
      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      showToast(message, 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ── Role-based alerts mapping ───────────────────────────────────────────
  const getRoleBasedAlerts = (role: string) => {
    const normalizedRole = (role || 'PASSENGER').toUpperCase();
    
    switch (normalizedRole) {
      case 'DRIVER':
        return [
          { key: 'tripUpdates', label: 'Trip Notifications', desc: 'Get notified about active trips, passenger boarding, and routing updates.' },
          { key: 'bookingAlerts', label: 'Booking Alerts', desc: 'Receive alerts when a passenger books your trip or cancels their seat.' },
          { key: 'paymentAlerts', label: 'Earnings Alerts', desc: 'Get notified when payouts are processed or earnings are credited.' },
          { key: 'supportReplies', label: 'Vehicle Notifications', desc: 'Alerts regarding vehicle inspections, document expiry, or compliance.' },
        ];
      case 'FLEET_OWNER':
      case 'VEHICLE_OWNER':
        return [
          { key: 'bookingAlerts', label: 'Vehicle Notifications', desc: 'Get notified about inspections, document compliance, and health of your fleet vehicles.' },
          { key: 'supportReplies', label: 'Driver Alerts', desc: 'Alerts regarding driver logins, status changes, and assignments.' },
          { key: 'tripUpdates', label: 'Trip Notifications', desc: 'Real-time updates on active routes operated by your fleet.' },
          { key: 'paymentAlerts', label: 'Payment Alerts', desc: 'Earnings notifications, fleet commissions, and subscription invoices.' },
        ];
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return [
          { key: 'tripUpdates', label: 'System Alerts', desc: 'Alerts about server performance, database issues, or third-party API limits.' },
          { key: 'supportReplies', label: 'User Reports', desc: 'Get notified when a passenger or driver submits a report or complaint.' },
          { key: 'bookingAlerts', label: 'Approval Requests', desc: 'Notifications for pending driver registrations, vehicle documents, and fleet approvals.' },
          { key: 'paymentAlerts', label: 'Audit Events', desc: 'Critical security events, privilege updates, or financial adjustments.' },
        ];
      case 'SUPPORT':
        return [
          { key: 'supportReplies', label: 'Ticket Notifications', desc: 'Get notified about new tickets, comments, or transfers in your queue.' },
          { key: 'tripUpdates', label: 'Escalation Alerts', desc: 'Receive alerts for SLA breaches, high-priority issues, or admin escalations.' },
        ];
      default: // PASSENGER
        return [
          { key: 'tripUpdates', label: 'Trip Notifications', desc: 'Receive real-time updates when a driver is assigned, the trip starts, or if there is a delay.' },
          { key: 'bookingAlerts', label: 'Booking Alerts', desc: 'Receive confirmations and details for your booked rides.' },
          { key: 'paymentAlerts', label: 'Payment Alerts', desc: 'Get notified about successful charges, payment failures, and refunds.' },
          { key: 'supportReplies', label: 'Support Replies', desc: 'Get notified when support agents respond to your tickets.' },
        ];
    }
  };

  const alertCategories = getRoleBasedAlerts(user?.userType || 'PASSENGER');
  const showPromoToggle = ['PASSENGER', 'DRIVER', 'FLEET_OWNER', 'VEHICLE_OWNER'].includes((user?.userType || '').toUpperCase());

  return (
    <div className="space-y-6 max-w-3xl pb-12">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-2 rounded-xl bg-gray-100">
            <SettingsIcon className="w-5 h-5 text-gray-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Settings</h1>
        </div>
        <p className="text-sm text-gray-500">
          Manage your account preferences and security
        </p>
      </div>

      {/* Notification Preferences */}
      <Card>
        <div className="p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary-600" />
              <h2 className="text-base font-bold text-gray-900">Notification Preferences</h2>
            </div>
            <Link
              href="/dashboard/notifications"
              className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-xl border border-primary-100/50 transition-colors"
            >
              <HistoryIcon className="w-3.5 h-3.5" />
              View Notification History
            </Link>
          </div>

          {isLoadingPrefs ? (
            <div className="py-8"><Loading text="Loading preferences..." /></div>
          ) : (
            <div className="space-y-6">
              {/* Channels */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Delivery Channels</p>
                {[
                  { key: 'emailEnabled', label: 'Email Notifications', desc: 'Receive transactional receipts, system logs, and updates via email.' },
                  { key: 'pushEnabled', label: 'Push Notifications', desc: 'Browser push notifications for real-time tracking and ticket events.' },
                  { key: 'smsEnabled', label: 'SMS Notifications', desc: 'Text messages for emergency notifications and trip boarding alerts.' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100/50">
                    <div className="pr-4">
                      <p className="text-sm font-bold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <Switch
                      checked={(notifPrefs as any)[key]}
                      onCheckedChange={(checked: boolean) => handleToggle(key, checked)}
                    />
                  </div>
                ))}
              </div>

              {/* Alert Types */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Alert Subscriptions</p>
                {alertCategories.map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100/50">
                    <div className="pr-4">
                      <p className="text-sm font-bold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <Switch
                      checked={(notifPrefs as any)[key]}
                      onCheckedChange={(checked: boolean) => handleToggle(key, checked)}
                    />
                  </div>
                ))}

                {showPromoToggle && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100/50">
                    <div className="pr-4">
                      <p className="text-sm font-bold text-gray-800">Promotions & Offers</p>
                      <p className="text-xs text-gray-500 mt-0.5">Receive notifications about discount vouchers, new routes, and updates.</p>
                    </div>
                    <Switch
                      checked={notifPrefs.promotionalEmails}
                      onCheckedChange={(checked: boolean) => handleToggle('promotionalEmails', checked)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Regional preferences */}
      <Card>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Languages className="w-5 h-5 text-primary-600" />
            <h2 className="text-base font-bold text-gray-900">Regional Preferences</h2>
          </div>

          <form onSubmit={handleSaveLanguage} className="space-y-4">
            <Select
              label="Preferred Language"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Español' },
                { value: 'fr', label: 'Français' },
                { value: 'hi', label: 'हिन्दी (Hindi)' },
              ]}
            />
            <Button
              type="submit"
              size="sm"
              isLoading={isSavingLang}
              disabled={preferredLanguage === (user?.preferredLanguage || 'en')}
            >
              Save Language
            </Button>
          </form>
        </div>
      </Card>

      {/* Security */}
      <Card>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-primary-600" />
            <h2 className="text-base font-bold text-gray-900">Security</h2>
          </div>

          {!showPasswordForm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Password</p>
                <p className="text-xs text-gray-500">Change your account password</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setShowPasswordForm(true)}>
                Change Password
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Input
                  label="Current Password"
                  type={showCurrentPwd ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  label="New Password"
                  type={showNewPwd ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd(!showNewPwd)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={handleChangePassword}
                  isLoading={isChangingPassword}
                  disabled={!currentPassword || !newPassword || !confirmPassword}
                >
                  Update Password
                </Button>
                <Button size="sm" variant="secondary" onClick={() => {
                  setShowPasswordForm(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Account Info */}
      <Card>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary-600" />
            <h2 className="text-base font-bold text-gray-900">Account</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-900">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Phone</span>
              <span className="font-medium text-gray-900">{user?.phone}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Account Type</span>
              <span className="font-medium text-gray-900">{user?.userType}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-500">Member Since</span>
              <span className="font-medium text-gray-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
