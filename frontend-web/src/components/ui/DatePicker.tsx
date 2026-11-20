'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  addDays,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, X, Check, RotateCcw } from 'lucide-react';

export interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  onClear?: () => void;
  title?: string;
  subtitle?: string;
}

export default function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select date',
  disabled = false,
  className,
  triggerClassName,
  onClear,
  title = 'Select Departure Date',
  subtitle = 'Choose your travel date across Maharashtra',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(value || minDate || new Date());
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Synchronize currentMonth when value or modal opens
  useEffect(() => {
    if (isOpen) {
      if (value) {
        setCurrentMonth(value);
      } else if (minDate && isBefore(new Date(), minDate)) {
        setCurrentMonth(minDate);
      } else {
        setCurrentMonth(new Date());
      }
    }
  }, [isOpen, value, minDate]);

  // Detect mobile screen (< 640px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lock background scroll when open on mobile
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  // Click outside & Escape key listeners for desktop popover
  useEffect(() => {
    if (!isOpen || isMobile) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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
  }, [isOpen, isMobile]);

  // Calendar calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat

  const today = new Date();
  const tomorrow = addDays(today, 1);
  const dayAfter = addDays(today, 2);

  const isPrevDisabled = minDate
    ? isBefore(endOfMonth(subMonths(currentMonth, 1)), startOfDay(minDate))
    : false;

  const isNextDisabled = maxDate
    ? isBefore(startOfDay(maxDate), startOfMonth(addMonths(currentMonth, 1)))
    : false;

  const handlePrevMonth = () => {
    if (!isPrevDisabled) setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    if (!isNextDisabled) setCurrentMonth(addMonths(currentMonth, 1));
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && isBefore(startOfDay(date), startOfDay(minDate))) return true;
    if (maxDate && isBefore(startOfDay(maxDate), startOfDay(date))) return true;
    return false;
  };

  const handleDateSelect = (date: Date) => {
    onChange(date);
    setIsOpen(false);
  };

  const formatTriggerLabel = (d?: Date) => {
    if (!d) return null;
    if (isToday(d)) {
      return `Today, ${format(d, 'd MMM yyyy')}`;
    }
    if (isSameDay(d, tomorrow)) {
      return `Tomorrow, ${format(d, 'd MMM yyyy')}`;
    }
    return format(d, 'EEE, d MMM yyyy');
  };

  // Calendar Body Content (Shared between Mobile Bottom Sheet and Desktop Popover)
  const renderCalendarContent = () => (
    <div className="w-full select-none">
      {/* Month Header Navigation */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={isPrevDisabled}
          aria-label="Previous Month"
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
            isPrevDisabled
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100 active:scale-95'
          )}
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        <div className="text-sm font-bold text-slate-800 tracking-tight">
          {format(currentMonth, 'MMMM yyyy')}
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          disabled={isNextDisabled}
          aria-label="Next Month"
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
            isNextDisabled
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100 active:scale-95'
          )}
        >
          <ChevronRight className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, idx) => (
          <div
            key={day}
            className={cn(
              'text-center text-[11px] font-bold py-1',
              idx === 0 || idx === 6 ? 'text-rose-500' : 'text-slate-500'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {/* Empty slots for month starting offset */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-10 sm:h-9 w-full" />
        ))}

        {/* Days of current month */}
        {days.map((day) => {
          const disabledDay = isDateDisabled(day);
          const selected = value && isSameDay(day, value);
          const isTodayDate = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => !disabledDay && handleDateSelect(day)}
              disabled={disabledDay}
              className={cn(
                'h-10 sm:h-9 w-full rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center relative transition-all duration-150',
                disabledDay && 'text-slate-300 cursor-not-allowed opacity-40',
                !disabledDay && !selected && 'text-slate-700 hover:bg-blue-50/80 active:scale-95',
                isTodayDate &&
                  !selected &&
                  !disabledDay &&
                  'border border-[#1D68F2] text-[#1D68F2] font-bold bg-blue-50/40',
                selected &&
                  'bg-[#1D68F2] text-white font-bold shadow-md shadow-blue-500/30 scale-105 z-10'
              )}
            >
              {format(day, 'd')}
              {isTodayDate && !selected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#1D68F2]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center justify-between w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-left shadow-2xs transition-all duration-200',
          'hover:bg-gray-50/70 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1D68F2]/20 focus:border-[#1D68F2]',
          disabled && 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60',
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
              value ? 'bg-blue-100 text-[#1D68F2]' : 'bg-slate-100 text-slate-500'
            )}
          >
            <Calendar className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <span className={cn('truncate font-medium', value ? 'text-slate-900 font-semibold' : 'text-slate-400')}>
            {value ? formatTriggerLabel(value) : placeholder}
          </span>
        </div>

        {value && onClear ? (
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="w-5 h-5 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            title="Clear date"
          >
            <X className="w-3.5 h-3.5" />
          </div>
        ) : null}
      </button>

      {/* ── MOBILE VIEW: Native Bottom Sheet Modal (rendered via Portal) ── */}
      {isOpen && isMobile && typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            {/* Dark Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fadeIn"
              onClick={() => setIsOpen(false)}
            />

            {/* Bottom Sheet Drawer */}
            <div className="relative z-10 w-full bg-white rounded-t-3xl shadow-2xl border-t border-slate-100 px-4 pt-3 pb-6 max-h-[90vh] overflow-y-auto animate-slideUp">
              {/* Drag Handle Bar */}
              <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto mb-3" />

              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1D68F2] flex items-center justify-center">
                    <Calendar className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{title}</h3>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{subtitle}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 active:scale-95 transition-transform"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>

              {/* Quick Date Action Chips */}
              <div className="flex items-center gap-1.5 mb-4 overflow-x-auto no-scrollbar py-0.5">
                <button
                  type="button"
                  onClick={() => handleDateSelect(today)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95',
                    value && isSameDay(value, today)
                      ? 'bg-[#1D68F2] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  )}
                >
                  Today ({format(today, 'd MMM')})
                </button>
                <button
                  type="button"
                  onClick={() => handleDateSelect(tomorrow)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95',
                    value && isSameDay(value, tomorrow)
                      ? 'bg-[#1D68F2] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  )}
                >
                  Tomorrow ({format(tomorrow, 'd MMM')})
                </button>
                <button
                  type="button"
                  onClick={() => handleDateSelect(dayAfter)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95',
                    value && isSameDay(value, dayAfter)
                      ? 'bg-[#1D68F2] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  )}
                >
                  Day After ({format(dayAfter, 'd MMM')})
                </button>
              </div>

              {/* Calendar Month & Grid */}
              <div className="bg-slate-50/70 rounded-2xl border border-slate-100 p-3 mb-4">
                {renderCalendarContent()}
              </div>

              {/* Bottom Confirmation Bar */}
              <div className="flex items-center gap-2 pt-1">
                {value && (
                  <button
                    type="button"
                    onClick={() => {
                      onClear?.();
                      setIsOpen(false);
                    }}
                    className="h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-[#1D68F2] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {value ? `Confirm (${format(value, 'd MMM yyyy')})` : 'Select Any Date'}
                  </span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── DESKTOP VIEW: Anchored Inline Dropdown Popover ── */}
      {isOpen && !isMobile && (
        <div className="absolute top-full left-0 mt-2 z-50 w-[310px] bg-white rounded-2xl shadow-xl border border-slate-200 p-3.5 animate-fadeIn">
          {/* Quick chips on desktop */}
          <div className="flex items-center gap-1 mb-3 pb-2.5 border-b border-slate-100">
            <button
              type="button"
              onClick={() => handleDateSelect(today)}
              className={cn(
                'px-2 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-95',
                value && isSameDay(value, today)
                  ? 'bg-[#1D68F2] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleDateSelect(tomorrow)}
              className={cn(
                'px-2 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-95',
                value && isSameDay(value, tomorrow)
                  ? 'bg-[#1D68F2] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              Tomorrow
            </button>
            {value && onClear && (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setIsOpen(false);
                }}
                className="ml-auto text-[11px] font-semibold text-rose-500 hover:text-rose-700"
              >
                Clear
              </button>
            )}
          </div>

          {/* Calendar */}
          {renderCalendarContent()}
        </div>
      )}
    </div>
  );
}
