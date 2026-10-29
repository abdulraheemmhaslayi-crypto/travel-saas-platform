'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { generateInitials } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  fallback?: React.ReactNode;
}

const Avatar: React.FC<AvatarProps> = ({
  className,
  src,
  alt,
  name,
  size = 'md',
  status,
  fallback,
  ...props
}) => {
  const [error, setError] = React.useState(false);

  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
  };

  const statusColors = {
    online: 'bg-green-400',
    offline: 'bg-gray-400',
    away: 'bg-yellow-400',
    busy: 'bg-red-400',
  };

  const initials = name ? generateInitials(name.split(' ')[0] || '', name.split(' ')[1] || '') : '?';

  return (
    <div className={cn('relative inline-block', className)} {...props}>
      <div
        className={cn(
          'relative rounded-full overflow-hidden bg-gray-200 flex items-center justify-center font-medium text-gray-600',
          sizes[size]
        )}
      >
        {src && !error ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
        ) : fallback ? (
          fallback
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
            statusSizes[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
};

export default Avatar;