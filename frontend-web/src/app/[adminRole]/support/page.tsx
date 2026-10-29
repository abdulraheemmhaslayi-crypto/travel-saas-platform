'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useSupportStore } from '@/store/slices/supportSlice';
import { useAppStore } from '@/store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import TextArea from '@/components/ui/TextArea';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/common/Loading';
import TicketCard from '@/components/support/TicketCard';
import { Filter, Plus, AlertCircle, Clock, CheckCircle } from 'lucide-react';

export default function AdminSupportPage() {
  return (
    <Suspense fallback={<Loading fullScreen text="Loading support hub..." />}>
      <AdminSupportContent />
    </Suspense>
  );
}

function AdminSupportContent() {
  const { showToast } = useAppStore();
  const params = useParams();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const adminRole = params?.adminRole as string || 'admin';
  const {
    tickets,
    stats,
    filters,
    isLoading,
    error,
    totalCount,
    getTickets,
    getStats,
    setFilters,
    clearError,
  } = useSupportStore();

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    getStats();
  }, []);

  useEffect(() => {
    const tabFilters: any = { ...filters };
    if (tab === 'escalated') {
      tabFilters.status = 'ESCALATED';
    } else if (tab === 'complaints') {
      tabFilters.category = 'DRIVER_COMPLAINT';
    }
    getTickets(tabFilters);
  }, [filters, tab]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value || undefined, page: 1 });
  };

  const openTickets = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressTickets = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const escalatedTickets = tickets.filter((t) => t.isEscalated).length;

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <Button variant="secondary" size="sm" onClick={clearError} className="mt-2">
            Dismiss
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {tab === 'escalated' ? 'Escalated Support Tickets' : tab === 'complaints' ? 'User Complaints & Safety Concerns' : 'Support Tickets'}
          </h1>
          <p className="text-gray-600 mt-1">
            {tab === 'escalated' ? 'Urgent issues needing supervisor attention' : tab === 'complaints' ? 'Driver complaints and passenger safety concerns' : 'Manage and track all customer support requests'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{escalatedTickets} Escalated</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{openTickets} Open</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{inProgressTickets} In Progress</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-500">Total Tickets</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTickets}</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-500">Open</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.openTickets}</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-500">Resolved</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.resolvedTickets}</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-500">Escalated</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.escalatedTickets}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Filter Bar */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Select
                label="Status"
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'OPEN', label: 'Open' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'WAITING_CUSTOMER', label: 'Waiting Customer' },
                  { value: 'RESOLVED', label: 'Resolved' },
                  { value: 'CLOSED', label: 'Closed' },
                  { value: 'ESCALATED', label: 'Escalated' },
                ]}
              />
              <Select
                label="Priority"
                value={filters.priority || ''}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                options={[
                  { value: '', label: 'All Priorities' },
                  { value: 'LOW', label: 'Low' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HIGH', label: 'High' },
                  { value: 'URGENT', label: 'Urgent' },
                  { value: 'CRITICAL', label: 'Critical' },
                ]}
              />
              <Select
                label="Category"
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                options={[
                  { value: '', label: 'All Categories' },
                  { value: 'BOOKING_ISSUE', label: 'Booking Issue' },
                  { value: 'PAYMENT_ISSUE', label: 'Payment Issue' },
                  { value: 'REFUND_REQUEST', label: 'Refund Request' },
                  { value: 'DRIVER_COMPLAINT', label: 'Driver Complaint' },
                  { value: 'VEHICLE_ISSUE', label: 'Vehicle Issue' },
                  { value: 'SAFETY_CONCERN', label: 'Safety Concern' },
                  { value: 'APP_TECHNICAL', label: 'App Technical' },
                ]}
              />
              <Select
                label="Assigned"
                value={filters.assignedToMe ? 'true' : ''}
                onChange={(e) => handleFilterChange('assignedToMe', e.target.value === 'true' ? 'true' : '')}
                options={[
                  { value: '', label: 'All Tickets' },
                  { value: 'true', label: 'Assigned to Me' },
                ]}
              />
              <Input
                label="Search"
                placeholder="Search by ticket #, subject..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Tickets List */}
      {isLoading ? (
        <Loading text="Loading tickets..." />
      ) : tickets.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No tickets match the current filters</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/${adminRole}/support/${ticket.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-mono text-gray-500">#{ticket.ticketNumber}</span>
                        {ticket.isEscalated && (
                          <Badge variant="danger" size="sm">
                            ESCALATED
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{ticket.subject}</h3>
                      <p className="text-sm text-gray-600">From: {ticket.user.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          ticket.status === 'OPEN'
                            ? 'bg-blue-100 text-blue-800'
                            : ticket.status === 'IN_PROGRESS'
                            ? 'bg-yellow-100 text-yellow-800'
                            : ticket.status === 'RESOLVED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                        size="sm"
                      >
                        {ticket.status.replace(/_/g, ' ')}
                      </Badge>
                      <Badge
                        className={
                          ticket.priority === 'CRITICAL'
                            ? 'bg-red-100 text-red-700'
                            : ticket.priority === 'URGENT'
                            ? 'bg-orange-100 text-orange-700'
                            : ticket.priority === 'HIGH'
                            ? 'bg-yellow-100 text-yellow-700'
                            : ticket.priority === 'MEDIUM'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }
                        size="sm"
                      >
                        {ticket.priority}
                      </Badge>
                    </div>
                    {ticket.assignedTo && (
                      <span className="text-xs text-gray-500">
                        Assigned to: {ticket.assignedTo.name}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}