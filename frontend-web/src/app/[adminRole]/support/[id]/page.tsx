'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSupportStore } from '@/store/slices/supportSlice';
import { useAppStore } from '@/store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateTicketSchema,
  addCommentSchema,
  assignTicketSchema,
  escalateTicketSchema,
  type UpdateTicketFormData,
  type AddCommentFormData,
  type AssignTicketFormData,
  type EscalateTicketFormData,
} from '@/lib/validation-support';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import TextArea from '@/components/ui/TextArea';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Loading from '@/components/common/Loading';
import {
  ArrowLeft,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Send,
  Zap,
} from 'lucide-react';

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  OPEN: { color: 'bg-blue-100 text-blue-800', icon: <AlertCircle className="w-4 h-4" /> },
  IN_PROGRESS: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> },
  WAITING_CUSTOMER: { color: 'bg-orange-100 text-orange-800', icon: <MessageSquare className="w-4 h-4" /> },
  WAITING_THIRD_PARTY: {
    color: 'bg-orange-100 text-orange-800',
    icon: <Clock className="w-4 h-4" />,
  },
  RESOLVED: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
  CLOSED: { color: 'bg-gray-100 text-gray-800', icon: <CheckCircle className="w-4 h-4" /> },
  REOPENED: { color: 'bg-red-100 text-red-800', icon: <AlertCircle className="w-4 h-4" /> },
  ESCALATED: { color: 'bg-red-100 text-red-800', icon: <AlertCircle className="w-4 h-4" /> },
};

export default function AdminTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  const { showToast } = useAppStore();
  const {
    currentTicket,
    isLoading,
    error,
    getTicket,
    updateTicket,
    assignTicket,
    escalateTicket,
    resolveTicket,
    reopenTicket,
    addComment,
  } = useSupportStore();

  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);

  const {
    register: registerComment,
    handleSubmit: handleCommentSubmit,
    formState: { isSubmitting: isCommentSubmitting },
    reset: resetComment,
  } = useForm<AddCommentFormData>({
    resolver: zodResolver(addCommentSchema),
  });

  const {
    register: registerResolve,
    handleSubmit: handleResolveSubmit,
    formState: { isSubmitting: isResolveSubmitting },
    reset: resetResolve,
  } = useForm<UpdateTicketFormData>({
    resolver: zodResolver(updateTicketSchema),
  });

  const {
    register: registerAssign,
    handleSubmit: handleAssignSubmit,
    formState: { isSubmitting: isAssignSubmitting },
    reset: resetAssign,
  } = useForm<AssignTicketFormData>({
    resolver: zodResolver(assignTicketSchema),
  });

  const {
    register: registerEscalate,
    handleSubmit: handleEscalateSubmit,
    formState: { isSubmitting: isEscalateSubmitting },
    reset: resetEscalate,
  } = useForm<EscalateTicketFormData>({
    resolver: zodResolver(escalateTicketSchema),
  });

  useEffect(() => {
    if (ticketId) {
      getTicket(ticketId);
    }
  }, [ticketId]);

  const onAddComment = async (data: AddCommentFormData) => {
    try {
      await addComment(ticketId, data);
      showToast('Comment added successfully', 'success');
      resetComment();
      setShowCommentForm(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add comment';
      showToast(message, 'error');
    }
  };

  const onResolveTicket = async (data: UpdateTicketFormData) => {
    try {
      await resolveTicket(ticketId, data);
      showToast('Ticket resolved', 'success');
      resetResolve();
      setShowResolveModal(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resolve ticket';
      showToast(message, 'error');
    }
  };

  const onAssignTicket = async (data: AssignTicketFormData) => {
    try {
      await assignTicket(ticketId, data);
      showToast('Ticket assigned', 'success');
      resetAssign();
      setShowAssignModal(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign ticket';
      showToast(message, 'error');
    }
  };

  const onEscalateTicket = async (data: EscalateTicketFormData) => {
    try {
      await escalateTicket(ticketId, data);
      showToast('Ticket escalated', 'success');
      resetEscalate();
      setShowEscalateModal(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to escalate ticket';
      showToast(message, 'error');
    }
  };

  const onReopenTicket = async () => {
    try {
      await reopenTicket(ticketId, { reason: 'Reopened by admin' });
      showToast('Ticket reopened', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reopen ticket';
      showToast(message, 'error');
    }
  };

  if (isLoading) {
    return <Loading text="Loading ticket..." />;
  }

  if (error || !currentTicket) {
    return (
      <div className="space-y-4">
        <Button
          variant="secondary"
          onClick={() => router.back()}
          className="flex items-center gap-2"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back
        </Button>
        <Card>
          <div className="p-6 text-center">
            <p className="text-red-600">{error || 'Ticket not found'}</p>
          </div>
        </Card>
      </div>
    );
  }

  const status = statusConfig[currentTicket.status] || statusConfig.OPEN;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => router.back()}
          className="flex items-center gap-2"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back
        </Button>
        <div className="flex gap-2">
          {currentTicket.status !== 'RESOLVED' && currentTicket.status !== 'CLOSED' && (
            <>
              {currentTicket.status !== 'ESCALATED' && (
                <Button
                  variant="danger"
                  onClick={() => setShowEscalateModal(true)}
                  className="flex items-center gap-2"
                  leftIcon={<Zap className="w-4 h-4" />}
                >
                  Escalate
                </Button>
              )}
              <Button
                onClick={() => setShowResolveModal(true)}
                className="flex items-center gap-2"
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Resolve
              </Button>
            </>
          )}
          {(currentTicket.status === 'RESOLVED' || currentTicket.status === 'CLOSED') && (
            <Button
              variant="secondary"
              onClick={onReopenTicket}
              className="flex items-center gap-2"
              leftIcon={<AlertCircle className="w-4 h-4" />}
            >
              Reopen
            </Button>
          )}
          {!currentTicket.assignedTo && (
            <Button
              variant="secondary"
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-2"
              leftIcon={<User className="w-4 h-4" />}
            >
              Assign
            </Button>
          )}
        </div>
      </div>

      {/* Main Ticket Info */}
      <Card>
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentTicket.subject}</h1>
              <p className="text-sm text-gray-500">Ticket #{currentTicket.ticketNumber}</p>
            </div>
            {currentTicket.isEscalated && (
              <Badge variant="danger" size="md">
                ESCALATED
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <Badge className={status.color} size="md">
              <span className="flex items-center gap-2">
                {status.icon}
                {currentTicket.status.replace(/_/g, ' ')}
              </span>
            </Badge>
            <Badge
              className={
                currentTicket.priority === 'CRITICAL'
                  ? 'bg-red-100 text-red-700'
                  : currentTicket.priority === 'URGENT'
                  ? 'bg-orange-100 text-orange-700'
                  : currentTicket.priority === 'HIGH'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-blue-100 text-blue-700'
              }
              size="md"
            >
              {currentTicket.priority}
            </Badge>
            <Badge className="bg-purple-100 text-purple-700" size="md">
              {currentTicket.category.replace(/_/g, ' ')}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Description</p>
              <p className="text-gray-900">{currentTicket.description}</p>
            </div>

            {currentTicket.resolution && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Resolution</p>
                <p className="text-gray-900">{currentTicket.resolution}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Created By</p>
              <p className="text-sm font-medium text-gray-900">{currentTicket.user.name}</p>
            </div>
            {currentTicket.assignedTo && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Assigned To</p>
                <p className="text-sm font-medium text-gray-900">{currentTicket.assignedTo.name}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Created</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(currentTicket.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Responses</p>
              <p className="text-sm font-medium text-gray-900">{currentTicket.responseCount}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Comments Section */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comments ({currentTicket.comments?.length || 0})
          </h2>

          <div className="space-y-4 mb-6">
            {currentTicket.comments && currentTicket.comments.length > 0 ? (
              currentTicket.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-4 rounded-lg border ${
                    comment.isInternal ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{comment.user.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {comment.isInternal && (
                      <Badge variant="info" size="sm">
                        Internal
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-700 text-sm">{comment.message}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No comments yet</p>
            )}
          </div>

          {/* Add Comment Form */}
          {!showCommentForm ? (
            <Button
              variant="secondary"
              onClick={() => setShowCommentForm(true)}
              className="w-full flex items-center justify-center gap-2"
              leftIcon={<Send className="w-4 h-4" />}
            >
              Add Comment
            </Button>
          ) : (
            <form className="space-y-4" onSubmit={handleCommentSubmit(onAddComment)}>
              <TextArea
                label="Comment"
                placeholder="Add a comment..."
                rows={4}
                {...registerComment('message')}
                required
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...registerComment('isInternal')} />
                  <span className="text-sm text-gray-600">Internal note (not visible to customer)</span>
                </label>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCommentForm(false);
                    resetComment();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isCommentSubmitting}>
                  Post Comment
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>

      {/* Resolve Modal */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => {
          setShowResolveModal(false);
          resetResolve();
        }}
        title="Resolve Ticket"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowResolveModal(false);
                resetResolve();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleResolveSubmit(onResolveTicket)} isLoading={isResolveSubmitting}>
              Resolve Ticket
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <TextArea
            label="Resolution Summary"
            placeholder="Explain how the issue was resolved..."
            rows={4}
            {...registerResolve('resolution')}
            required
          />
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          resetAssign();
        }}
        title="Assign Ticket"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAssignModal(false);
                resetAssign();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignSubmit(onAssignTicket)} isLoading={isAssignSubmitting}>
              Assign
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <Input
            label="Agent ID"
            placeholder="Enter support agent ID"
            {...registerAssign('agentId')}
            required
          />
          <TextArea
            label="Note (optional)"
            placeholder="Add a note about the assignment..."
            rows={3}
            {...registerAssign('note')}
          />
        </form>
      </Modal>

      {/* Escalate Modal */}
      <Modal
        isOpen={showEscalateModal}
        onClose={() => {
          setShowEscalateModal(false);
          resetEscalate();
        }}
        title="Escalate Ticket"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowEscalateModal(false);
                resetEscalate();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEscalateSubmit(onEscalateTicket)} isLoading={isEscalateSubmitting}>
              Escalate
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <Select
            label="New Priority"
            placeholder="Select new priority"
            options={[
              { value: 'URGENT', label: 'Urgent' },
              { value: 'CRITICAL', label: 'Critical' },
            ]}
            {...registerEscalate('newPriority')}
            required
          />
          <TextArea
            label="Escalation Reason"
            placeholder="Explain why this ticket is being escalated..."
            rows={4}
            {...registerEscalate('reason')}
            required
          />
        </form>
      </Modal>
    </div>
  );
}
