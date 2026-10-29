'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSupportStore } from '@/store/slices/supportSlice';
import { useAppStore } from '@/store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTicketSchema, type CreateTicketFormData } from '@/lib/validation-support';
import { TicketStatus, TicketPriority, TicketCategory } from '@/types/support';
import TicketCard from '@/components/support/TicketCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import TextArea from '@/components/ui/TextArea';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import { Plus, Filter, MessageSquare } from 'lucide-react';

export default function SupportDashboardPage() {
  const { showToast } = useAppStore();
  const {
    tickets,
    filters,
    isLoading,
    error,
    totalCount,
    categories,
    getTickets,
    createTicket,
    getCategories,
    setFilters,
    clearError,
  } = useSupportStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
  });

  useEffect(() => {
    getTickets();
    getCategories();
  }, []);

  const onCreateTicket = async (data: CreateTicketFormData) => {
    try {
      await createTicket(data);
      showToast('Ticket created successfully', 'success');
      reset();
      setShowCreateModal(false);
      getTickets(filters);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create ticket';
      showToast(message, 'error');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value || undefined, page: 1 });
  };

  useEffect(() => {
    getTickets(filters);
  }, [filters]);

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
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-1">
            Manage your support requests and track their status
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Ticket
        </Button>
      </div>

      {/* Filter Bar */}
      <Card padding="none" shadow="none">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Filters</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-xl"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Status"
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'OPEN', label: 'Open' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'RESOLVED', label: 'Resolved' },
                  { value: 'CLOSED', label: 'Closed' },
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
                  ...Object.entries(TicketCategory).map(([key, value]) => ({
                    value: value,
                    label: key.replace(/_/g, ' '),
                  })),
                ]}
              />
              <Input
                label="Search"
                placeholder="Search tickets..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card shadow="none">
          <div className="p-4">
            <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Total Tickets</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{totalCount}</p>
          </div>
        </Card>
        <Card shadow="none">
          <div className="p-4">
            <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Open</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {tickets.filter((t) => t.status === 'OPEN').length}
            </p>
          </div>
        </Card>
        <Card shadow="none">
          <div className="p-4">
            <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600 mt-2">
              {tickets.filter((t) => t.status === 'IN_PROGRESS').length}
            </p>
          </div>
        </Card>
        <Card shadow="none">
          <div className="p-4">
            <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Resolved</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {tickets.filter((t) => t.status === 'RESOLVED').length}
            </p>
          </div>
        </Card>
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <Loading text="Loading tickets..." />
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No tickets found"
          description="Create your first support ticket to get started"
          icon="alert"
          action={{
            label: 'Create Ticket',
            onClick: () => setShowCreateModal(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}

      {/* Create Ticket Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          reset();
        }}
        title="Create Support Ticket"
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit(onCreateTicket)} isLoading={isSubmitting}>
              Create Ticket
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <Select
            label="Category"
            placeholder="Select category"
            options={Object.entries(TicketCategory).map(([key, value]) => ({
              value: value,
              label: key.replace(/_/g, ' '),
            }))}
            error={errors.category?.message}
            {...register('category')}
            required
          />

          <Input
            label="Subject"
            placeholder="Brief description of your issue"
            error={errors.subject?.message}
            {...register('subject')}
            required
          />

          <TextArea
            label="Description"
            placeholder="Provide detailed information about your issue"
            rows={4}
            error={errors.description?.message}
            {...register('description')}
            required
          />

          <Select
            label="Priority"
            placeholder="Select priority"
            options={Object.entries(TicketPriority).map(([key, value]) => ({
              value: value,
              label: key.replace(/_/g, ' '),
            }))}
            error={errors.priority?.message}
            {...register('priority')}
          />
        </form>
      </Modal>
    </div>
  );
}