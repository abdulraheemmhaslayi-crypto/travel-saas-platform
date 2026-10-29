'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, placeholder, disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          disabled={disabled}
          className={cn(
            'block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors duration-150',
            'hover:border-gray-300',
            'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10',
            disabled && 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed hover:border-gray-200',
            error && 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/10 hover:border-danger-400',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-xs font-medium text-danger-600">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-xs text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;