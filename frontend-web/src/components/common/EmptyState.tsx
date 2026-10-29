'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Search,
  Calendar,
  CreditCard,
  MapPin,
  Inbox,
  AlertCircle,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';
import Button from '@/components/ui/Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: 'search' | 'calendar' | 'payment' | 'location' | 'inbox' | 'alert' | 'briefcase';
  customIcon?: React.ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

const iconMap: Record<string, LucideIcon> = {
  search: Search,
  calendar: Calendar,
  payment: CreditCard,
  location: MapPin,
  inbox: Inbox,
  alert: AlertCircle,
  briefcase: Briefcase,
};

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'inbox',
  customIcon,
  action,
  secondaryAction,
  className,
}) => { const Icon = iconMap[icon] || Inbox;

  return (
    <div className={cn('text-center py-12 px-4', className)}>
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        {customIcon || <Icon className="w-8 h-8 text-gray-400" />}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">{description}</p>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {action && (
          action.href ? (
            <Link href={action.href}>
              <Button>{action.label}</Button>
            </Link>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )
        )}

        {secondaryAction && (
          secondaryAction.href ? (
            <Link href={secondaryAction.href}>
              <Button variant="secondary">{secondaryAction.label}</Button>
            </Link>
          ) : (
            <Button variant="secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )
        )}
      </div>
    </div>
  );
};

export default EmptyState;