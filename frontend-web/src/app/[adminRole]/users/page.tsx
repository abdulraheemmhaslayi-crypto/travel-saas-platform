'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import { useAuthStore } from '@/store/slices/authSlice';
import DataTable from '@/components/admin/DataTable';
import UserForm from '@/components/admin/UserForm';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Loading from '@/components/common/Loading';
import { User, Role } from '@/types/auth';
import { Search, Filter, Shield } from 'lucide-react';

export default function AdminUsersPage() {
  const { showToast } = useAppStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = searchParams.get('userType');

  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');

  const isSuperAdmin = user?.userType === 'SUPER_ADMIN';
  const adminRole = isSuperAdmin ? 'super-admin' : 'admin';

  useEffect(() => {
    if (userType && ['admin', 'super_admin', 'support'].includes(userType) && !isSuperAdmin) {
      showToast('Access denied. Admin management is restricted to Super Admin.', 'error');
      router.push(`/${adminRole}/users?userType=passenger`);
      return;
    }
    loadUsers();
  }, [page, searchQuery, userType, user, router, adminRole]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getUsers({
        page,
        limit: 10,
        search: searchQuery || undefined,
        userType: userType || undefined,
      });
      setUsers(response.data.data || response.data);
      setTotalCount(response.data.total || response.data.length);
    } catch (error) {
      showToast('Failed to load users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyKyc = async (userId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await apiClient.verifyKyc(userId, { status });
      showToast(`KYC ${status.toLowerCase()} successfully`, 'success');
      loadUsers();
    } catch (error) {
      showToast('Failed to update KYC status', 'error');
    }
  };

  const handleSuspend = async (userId: string) => {
    try {
      await apiClient.suspendUser(userId);
      showToast('User status updated', 'success');
      loadUsers();
    } catch (error) {
      showToast('Failed to update user', 'error');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'User',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => (
        <Badge variant={user.role === 'SUPER_ADMIN' ? 'danger' : user.role === 'ADMIN' ? 'warning' : 'default'}>
          {user.role}
        </Badge>
      ),
    },
    {
      key: 'userType',
      header: 'Type',
      render: (user: User) => (
        <Badge variant="outline">{user.userType}</Badge>
      ),
    },
    {
      key: 'kycStatus',
      header: 'KYC',
      render: (user: User) => (
        <Badge
          variant={
            user.kycStatus === 'VERIFIED'
              ? 'success'
              : user.kycStatus === 'REJECTED'
              ? 'danger'
              : user.kycStatus === 'SUBMITTED'
              ? 'warning'
              : 'default'
          }
          size="sm"
        >
          {user.kycStatus}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: User) => (
        <Badge variant={user.isSuspended ? 'danger' : 'success'} size="sm">
          {user.isSuspended ? 'Suspended' : 'Active'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedUser(user);
              setModalMode('view');
              setShowUserModal(true);
            }}
          >
            View
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedUser(user);
              setModalMode('edit');
              setShowUserModal(true);
            }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage platform users and KYC</p>
        </div>
      </div>

      <DataTable
        title="All Users"
        columns={columns}
        data={users}
        keyExtractor={(user) => user.id}
        isLoading={isLoading}
        totalCount={totalCount}
        page={page}
        onPageChange={setPage}
        onRowClick={(user) => {
          setSelectedUser(user);
          setModalMode('view');
          setShowUserModal(true);
        }}
        filters={
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        }
        bulkActions={[
          {
            label: 'Suspend Selected',
            onClick: (ids) => {
              ids.forEach((id) => handleSuspend(id));
            },
            variant: 'danger',
          },
        ]}
        selectable
      />

      {selectedUser && (
        <UserForm
          user={selectedUser}
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onSubmit={async (data) => {
            // Handle user update
            showToast('User updated', 'success');
            loadUsers();
          }}
          onVerifyKyc={handleVerifyKyc}
          onSuspend={handleSuspend}
          mode={modalMode}
        />
      )}
    </div>
  );
}