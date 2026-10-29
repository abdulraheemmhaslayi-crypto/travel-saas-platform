'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSupportStore } from '@/store/slices/supportSlice';
import { useAppStore } from '@/store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addCommentSchema, type AddCommentFormData } from '@/lib/validation-support';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import TextArea from '@/components/ui/TextArea';
import Loading from '@/components/common/Loading';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import {
  ArrowLeft,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Send,
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

const priorityConfig: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-yellow-100 text-yellow-700',
  URGENT: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  const { showToast } = useAppStore();
  const { currentTicket, isLoading, error, getTicket, addComment } = useSupportStore();

  const [showCommentForm, setShowCommentForm] = useState(false);
  const {
    register: registerComment,
    handleSubmit: handleCommentSubmit,
    formState: { errors: commentErrors, isSubmitting: isCommentSubmitting },
    reset: resetComment,
  } = useForm<AddCommentFormData>({
    resolver: zodResolver(addCommentSchema),
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
            <Badge className={priorityConfig[currentTicket.priority]} size="md">
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
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Created</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(currentTicket.createdAt).toLocaleString()}
              </p>
            </div>
            {currentTicket.assignedTo && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Assigned To</p>
                <p className="text-sm font-medium text-gray-900">{currentTicket.assignedTo.name}</p>
              </div>
            )}
            {currentTicket.resolvedAt && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Resolved</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(currentTicket.resolvedAt).toLocaleString()}
                </p>
              </div>
            )}
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
                error={commentErrors.message?.message}
                {...registerComment('message')}
                required
              />
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

      {/* Satisfaction Rating (if resolved) */}
      {currentTicket.status === 'RESOLVED' && !currentTicket.satisfactionRating && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Provide Feedback</h3>
            <p className="text-gray-600 mb-4">How satisfied are you with the resolution?</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant="secondary"
                  className="text-2xl"
                >
                  {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
