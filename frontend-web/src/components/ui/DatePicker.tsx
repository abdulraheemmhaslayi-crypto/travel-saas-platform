'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select date',
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [popupStyle, setPopupStyle] = useState({ left: 0, top: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDateSelect = (date: Date) => {
    onChange(date);
    setIsOpen(false);
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && isBefore(date, startOfDay(minDate))) return true;
    if (maxDate && isBefore(maxDate, date)) return true;
    return false;
  };

  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const top = rect.bottom + 8;
    const left = rect.left;
    const width = rect.width;

    setPopupStyle({ left, top, width });
  }, [isOpen, value]);

  return (
    <div className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'flex items-center w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-left shadow-sm transition-all duration-200 ease-in-out',
          'hover:bg-white hover:border-gray-300/80',
          'focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10',
          disabled && 'bg-gray-100/80 text-gray-400 border-gray-200 cursor-not-allowed hover:bg-gray-100/80 hover:border-gray-200 opacity-50',
          !value && 'text-gray-400',
          className
        )}
        disabled={disabled}
      >
        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
        {value ? format(value, 'MMM dd, yyyy') : placeholder}
      </button>

      {isOpen && buttonRef.current && typeof window !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="fixed z-50 bg-white rounded-2xl shadow-lg border border-gray-100 p-4"
            style={{
              top: popupStyle.top,
              left: popupStyle.left,
              width: popupStyle.width,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const disabled = isDateDisabled(day);
                const selected = value && isSameDay(day, value);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => !disabled && handleDateSelect(day)}
                    disabled={disabled}
                    className={cn(
                      'h-8 w-8 rounded-full text-sm flex items-center justify-center transition-colors',
                      !isSameMonth(day, currentMonth) && 'text-gray-300',
                      isSameMonth(day, currentMonth) && !selected && !disabled && 'text-gray-700 hover:bg-gray-100',
                      selected && 'bg-primary-600 text-white hover:bg-primary-700',
                      isTodayDate && !selected && 'border border-primary-600 text-primary-600',
                      disabled && 'text-gray-300 cursor-not-allowed'
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default DatePicker;