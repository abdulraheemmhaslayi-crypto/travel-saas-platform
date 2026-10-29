'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text = 'Loading...',
  fullScreen = false,
  className,
}) => {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary-600', sizes[size])} />
      {text && <p className="text-sm text-gray-500 animate-pulse">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
};

export const InlineLoading: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex items-center justify-center py-4', className)}>
    <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
  </div>
);

export const SkeletonLoading: React.FC<{ count?: number; className?: string }> = ({
  count = 3,
  className,
}) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-24" />
    ))}
  </div>
);

export default Loading;