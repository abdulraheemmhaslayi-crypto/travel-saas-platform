'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = 'md', shadow = 'none', border = true, children, ...props }, ref) => {
    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-5 md:p-6',
      lg: 'p-6 md:p-8',
    };

    const shadows = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-xl overflow-hidden',
          paddings[padding],
          shadows[shadow],
          border && 'border border-gray-100',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;