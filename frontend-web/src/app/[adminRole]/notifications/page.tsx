'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Loading from '@/components/common/Loading';
import { Bell, Send, Users, AlertTriangle, ArrowLeft, Info, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminNotificationCenterPage() {
  const { showToast } = useAppStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const adminRole = params?.adminRole as string || 'admin';

  // Active tab can be system | broadcast | announcements
  const activeTab = searchParams.get('tab') || 'system';

  const [notifications, setNotifications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Form states
  const [recipientType, setRecipientType] = useState<'single' | 'role'>('single');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'passenger' | 'driver' | 'vehicle_owner'>('passenger');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notifyChannel, setNotifyChannel] = useState<'IN_APP' | 'PUSH' | 'EMAIL'>('IN_APP');

  useEffect(() => {
    loadNotificationsAndUsers();
  }, []);

  const loadNotificationsAndUsers = async () => {
    setIsLoading(true);
    try {
      // In this SaaS platform, notifications are logged on a per-user basis.
      // We will pull the list of sent notifications or show system alerts log
      const [notifRes, usersRes] = await Promise.all([
        apiClient.getNotifications({ limit: 50 }),
        apiClient.getUsers({ limit: 100 }),
      ]);
      setNotifications(notifRes.data?.data || notifRes.data || []);
      setUsers(usersRes.data?.data || usersRes.data || []);
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      showToast('Please fill out all fields', 'error');
      return;
    }

    setIsSending(true);
    try {
      if (recipientType === 'single') {
        if (!selectedUserId) {
          showToast('Please select a recipient user', 'error');
          setIsSending(false);
          return;
        }
        await apiClient.post('/notifications', {
          userId: selectedUserId,
          title: title.trim(),
          body: body.trim(),
          type: 'SYSTEM',
          channel: notifyChannel,
        });
        showToast('Notification sent successfully!', 'success');
      } else {
        // Broadcast: resolve all users of the selected role
        const targetUsers = users.filter((u) => u.userType?.toLowerCase() === selectedRole.toLowerCase());
        
        if (targetUsers.length === 0) {
          showToast(`No users found with role ${selectedRole}`, 'error');
          setIsSending(false);
          return;
        }

        // Send notifications in parallel to resolved users
        await Promise.all(
          targetUsers.map((targetUser) =>
            apiClient.post('/notifications', {
              userId: targetUser.id,
              title: title.trim(),
              body: body.trim(),
              type: 'SYSTEM',
              channel: notifyChannel,
            })
          )
        );
        showToast(`Announcement broadcasted to ${targetUsers.length} users successfully!`, 'success');
      }

      // Reset form
      setTitle('');
      setBody('');
      loadNotificationsAndUsers();
    } catch (err) {
      showToast('Failed to deliver notifications.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleTabChange = (tab: string) => {
    router.push(`/${adminRole}/notifications?tab=${tab}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-5">
        <Link href={`/${adminRole}/dashboard`} className="p-2 rounded-lg hover:bg-gray-150 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notification & Announcement Center</h1>
          <p className="text-gray-500 mt-1 font-medium">Broadcast alerts, send system warnings, and direct messages to users</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto space-x-6">
        {[
          { id: 'system', label: 'System Announcements', icon: <Info className="w-4.5 h-4.5" /> },
          { id: 'broadcast', label: 'Compose Broadcast', icon: <Send className="w-4.5 h-4.5" /> },
          { id: 'announcements', label: 'Alert History Log', icon: <Bell className="w-4.5 h-4.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 pb-3 text-sm font-bold tracking-wide border-b-2 shrink-0 transition-all ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loading text="Loading announcement systems..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'broadcast' || activeTab === 'system' ? (
              <Card className="p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Send className="w-5 h-5 text-primary-600" />
                  Compose New Alert
                </h3>

                <form onSubmit={handleSendNotification} className="space-y-4">
                  {/* Recipient scope */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Recipient Scope</label>
                      <div className="flex gap-4 mt-1">
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="recipientType"
                            checked={recipientType === 'single'}
                            onChange={() => setRecipientType('single')}
                            className="w-4 h-4 text-primary-600 border-gray-300"
                          />
                          Direct User
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="recipientType"
                            checked={recipientType === 'role'}
                            onChange={() => setRecipientType('role')}
                            className="w-4 h-4 text-primary-600 border-gray-300"
                          />
                          Broadcast Role
                        </label>
                      </div>
                    </div>

                    <div>
                      {recipientType === 'single' ? (
                        <>
                          <label className="text-xs font-bold text-slate-700 block mb-1.5">Target User Recipient</label>
                          <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-white font-semibold focus:outline-none"
                          >
                            <option value="">-- Choose User --</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.firstName} {u.lastName} ({u.userType} - {u.email})
                              </option>
                            ))}
                          </select>
                        </>
                      ) : (
                        <>
                          <label className="text-xs font-bold text-slate-700 block mb-1.5">Target Role Group</label>
                          <select
                            value={selectedRole}
                            onChange={(e: any) => setSelectedRole(e.target.value)}
                            className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-white font-semibold focus:outline-none"
                          >
                            <option value="passenger">All Passengers</option>
                            <option value="driver">All Drivers</option>
                            <option value="vehicle_owner">All Vehicle Owners</option>
                          </select>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Alert Title</label>
                    <Input
                      placeholder="Enter a descriptive title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  {/* Body text */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Message Body</label>
                    <textarea
                      placeholder="Write message details..."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={5}
                      className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none font-medium"
                      required
                    />
                  </div>

                  {/* Channels */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Delivery Channel</label>
                      <select
                        value={notifyChannel}
                        onChange={(e: any) => setNotifyChannel(e.target.value)}
                        className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-white focus:outline-none font-semibold"
                      >
                        <option value="IN_APP">In-App Notification Only</option>
                        <option value="PUSH">Push Alert Only</option>
                        <option value="EMAIL">Email Integration</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="submit"
                        disabled={isSending}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs gap-1.5 flex items-center justify-center shadow-md"
                      >
                        <Send className="w-4 h-4" />
                        {isSending ? 'Sending...' : 'Dispatch Notification'}
                      </Button>
                    </div>
                  </div>
                </form>
              </Card>
            ) : (
              /* Alert history log tab */
              <Card className="p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Bell className="w-5 h-5 text-indigo-500" />
                  Alert History Log
                </h3>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-start gap-1.5">
                        <h4 className="text-xs font-bold text-slate-850">{n.title}</h4>
                        <Badge variant="outline" className="text-[9px] uppercase font-bold">{n.type}</Badge>
                      </div>
                      <p className="text-xs text-gray-600 font-medium">{n.body}</p>
                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold pt-1.5 border-t border-gray-150/40">
                        <span>Delivered to: User ID {n.userId?.slice(0, 8)}...</span>
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}

                  {notifications.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-10 bg-slate-55 rounded-xl">No notification history records.</p>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Quick HUD guide */}
          <Card className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-md space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-300">Broadcast Guidelines</h4>
            
            <div className="space-y-3.5 text-xs text-slate-200 font-medium">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                <p><strong>System Alerts:</strong> Critical updates or service interruptions. Always routed as In-App.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p><strong>User Warnings:</strong> Scoped safety alerts or direct user KYC resubmission updates.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p><strong>Campaigns:</strong> Promotional newsletters or discount bulletins. Routed as Email.</p>
              </div>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-[10px] text-slate-400">
              Note: Broadcasting alerts sends parallel requests scoped to user groups and updates individual Redis counters.
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
