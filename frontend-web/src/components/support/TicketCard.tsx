'use client';

import React from 'react';
import Link from 'next/link';
import { SupportTicket, TicketStatus, TicketPriority } from '@/types/support';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { Clock, AlertCircle, CheckCircle, MessageSquare, ChevronRight } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface TicketCardProps {
  ticket: SupportTicket;
  isAdmin?: boolean;
  onSelect?: (id: string) => void;
}

const statusConfig: Record<TicketStatus, { color: string; icon: React.ReactNode }> = {
  [TicketStatus.OPEN]: { color: 'bg-blue-100 text-blue-800', icon: <AlertCircle className="w-4 h-4" /> },
  [TicketStatus.IN_PROGRESS]: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> },
  [TicketStatus.WAITING_CUSTOMER]: { color: 'bg-orange-100 text-orange-800', icon: <MessageSquare className="w-4 h-4" /> },
  [TicketStatus.WAITING_THIRD_PARTY]: { color: 'bg-orange-100 text-orange-800', icon: <Clock className="w-4 h-4" /> },
  [TicketStatus.RESOLVED]: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
  [TicketStatus.CLOSED]: { color: 'bg-gray-100 text-gray-800', icon: <CheckCircle className="w-4 h-4" /> },
  [TicketStatus.REOPENED]: { color: 'bg-red-100 text-red-800', icon: <AlertCircle className="w-4 h-4" /> },
  [TicketStatus.ESCALATED]: { color: 'bg-red-100 text-red-800', icon: <AlertCircle className="w-4 h-4" /> },
};

const priorityConfig: Record<TicketPriority, string> = {
  [TicketPriority.LOW]: 'bg-gray-100 text-gray-700',
  [TicketPriority.MEDIUM]: 'bg-blue-100 text-blue-700',
  [TicketPriority.HIGH]: 'bg-yellow-100 text-yellow-700',
  [TicketPriority.URGENT]: 'bg-orange-100 text-orange-700',
  [TicketPriority.CRITICAL]: 'bg-red-100 text-red-700',
};

export default function TicketCard({ ticket, isAdmin = false, onSelect }: TicketCardProps) {
  const status = statusConfig[ticket.status];
  const baseUrl = isAdmin ? '/admin/support' : '/dashboard/support';

  return (
    <Link href={`${baseUrl}/${ticket.id}`} onClick={(e) => onSelect?.(ticket.id)}>
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
              <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge className={status.color} size="sm">
                <span className="flex items-center gap-1">
                  {status.icon}
                  {ticket.status.replace('_', ' ')}
                </span>
              </Badge>
              <Badge className={priorityConfig[ticket.priority]} size="sm">
                {ticket.priority}
              </Badge>
            </div>
            {isAdmin && ticket.assignedTo && (
              <span className="text-xs text-gray-500">
                Assigned to: {ticket.assignedTo.name}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span>{ticket.responseCount} responses</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDateTime(ticket.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
