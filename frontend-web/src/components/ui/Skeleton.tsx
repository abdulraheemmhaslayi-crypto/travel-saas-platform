'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  style,
  ...props
}) => {
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-md',
  };

  const animations = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-gray-200',
        variants[variant],
        animations[animation],
        className
      )}
      style={{
        width: width,
        height: height,
        ...style,
      }}
      {...props}
    />
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={i === lines - 1 && lines > 1 ? '0.75rem' : '1rem'}
          width={i === lines - 1 && lines > 1 ? '80%' : '100%'}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('space-y-4 p-4', className)}>
      <Skeleton variant="rounded" height="12rem" />
      <SkeletonText lines={3} />
    </div>
  );
};

export default Skeleton;