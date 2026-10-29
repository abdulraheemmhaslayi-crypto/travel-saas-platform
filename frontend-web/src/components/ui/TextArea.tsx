'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, helperText, disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400/80 shadow-sm transition-all duration-200 ease-in-out',
            'hover:bg-white hover:border-gray-300/80',
            'focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10',
            disabled && 'bg-gray-100/80 text-gray-400 border-gray-200 cursor-not-allowed hover:bg-gray-100/80 hover:border-gray-200',
            error && 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/10 hover:border-danger-400/80',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs font-medium text-danger-600">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-xs text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;
