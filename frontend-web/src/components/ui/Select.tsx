'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  leftIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  triggerClassName?: string;
  popoverClassName?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      triggerClassName,
      popoverClassName,
      label,
      error,
      helperText,
      options,
      placeholder,
      leftIcon,
      size = 'md',
      disabled,
      ...props
    },
    ref
  ) => {
    const id = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const hiddenSelectRef = useRef<HTMLSelectElement | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    // Combine forwarded ref and internal ref for the hidden native select
    const setCombinedRefs = React.useCallback(
      (node: HTMLSelectElement | null) => {
        hiddenSelectRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLSelectElement | null>).current = node;
        }
      },
      [ref]
    );

    // Track controlled vs uncontrolled value
    const [internalValue, setInternalValue] = useState<string>(() => {
      if (props.value !== undefined && props.value !== null) return String(props.value);
      if (props.defaultValue !== undefined && props.defaultValue !== null) return String(props.defaultValue);
      return '';
    });

    const isControlled = props.value !== undefined;
    const currentValue = isControlled ? String(props.value ?? '') : internalValue;

    useEffect(() => {
      if (props.value !== undefined && props.value !== null) {
        setInternalValue(String(props.value));
      }
    }, [props.value]);

    // Handle outside clicks and escape key
    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (event: MouseEvent | TouchEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          if (props.onBlur && hiddenSelectRef.current) {
            const blurEvt = {
              target: hiddenSelectRef.current,
              currentTarget: hiddenSelectRef.current,
            } as unknown as React.FocusEvent<HTMLSelectElement>;
            props.onBlur(blurEvt);
          }
        }
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isOpen, props.onBlur]);

    // Option selection handler
    const handleSelect = (val: string) => {
      if (disabled) return;

      if (!isControlled) {
        setInternalValue(val);
      }
      setIsOpen(false);

      if (hiddenSelectRef.current) {
        hiddenSelectRef.current.value = val;
        try {
          const changeEvt = new Event('change', { bubbles: true });
          hiddenSelectRef.current.dispatchEvent(changeEvt);
        } catch {
          // Fallback if browser restricts synthetic events
        }
      }

      if (props.onChange) {
        const syntheticEvent = {
          target: {
            value: val,
            name: props.name || '',
          },
          currentTarget: {
            value: val,
            name: props.name || '',
          },
          type: 'change',
          bubbles: true,
          defaultPrevented: false,
          preventDefault: () => {},
          stopPropagation: () => {},
          persist: () => {},
        } as unknown as React.ChangeEvent<HTMLSelectElement>;

        props.onChange(syntheticEvent);
      }
    };

    const selectedOption = options.find((opt) => String(opt.value) === String(currentValue));

    const sizeStyles = {
      sm: 'h-9 px-3 text-xs',
      md: 'h-11 px-3.5 text-sm',
      lg: 'h-12 px-4 text-base',
    };

    return (
      <div ref={containerRef} className="relative w-full text-left">
        {/* Label */}
        {label && (
          <label htmlFor={id} className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Custom Dropdown Trigger Button */}
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={cn(
            'w-full rounded-xl border border-slate-200 bg-white text-left font-medium transition-all duration-150 flex items-center justify-between gap-2',
            sizeStyles[size],
            'hover:border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10',
            isOpen && 'border-blue-600 ring-2 ring-blue-500/10 shadow-xs',
            disabled && 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed hover:border-slate-200 opacity-60',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500/10 hover:border-red-400',
            triggerClassName,
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {leftIcon && <span className="text-slate-400 shrink-0">{leftIcon}</span>}
            {selectedOption ? (
              <span className="text-slate-900 font-medium truncate flex items-center gap-2">
                {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
                <span className="truncate">{selectedOption.label}</span>
              </span>
            ) : (
              <span className="text-slate-400 truncate">{placeholder || 'Select an option'}</span>
            )}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200',
              isOpen && 'rotate-180 text-blue-600'
            )}
          />
        </button>

        {/* Custom Popover Menu */}
        {isOpen && (
          <div
            role="listbox"
            className={cn(
              'absolute left-0 right-0 z-50 mt-1.5 w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden py-1.5 animate-in fade-in-50 zoom-in-95 duration-150',
              popoverClassName
            )}
            style={{ minWidth: '100%' }}
          >
            <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
              {options.length === 0 ? (
                <div className="px-3.5 py-3 text-xs text-slate-400 text-center font-medium">
                  No options available
                </div>
              ) : (
                options.map((option) => {
                  const isSelected = String(option.value) === String(currentValue);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        'w-full px-3.5 py-2.5 text-left text-xs sm:text-sm font-medium flex items-center justify-between gap-2 transition-colors select-none',
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
                        option.disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {option.icon && <span className="shrink-0">{option.icon}</span>}
                        <div className="truncate">
                          <div className="truncate">{option.label}</div>
                          {option.description && (
                            <div className="text-[10px] text-slate-400 font-normal truncate">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Hidden native select for form submissions and react-hook-form refs */}
        <select
          ref={setCombinedRefs}
          name={props.name}
          value={currentValue}
          onChange={() => {}}
          onBlur={props.onBlur}
          disabled={disabled}
          required={props.required}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only pointer-events-none absolute -bottom-px left-0 h-0 w-0 opacity-0"
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

        {/* Error and helper texts */}
        {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
