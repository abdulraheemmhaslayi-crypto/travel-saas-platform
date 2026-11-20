'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-6">
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      <div
        className={cn(
          'relative z-10 bg-white rounded-t-[28px] sm:rounded-2xl shadow-2xl w-full transform transition-all max-h-[88vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200',
          sizes[size]
        )}
      >
        {/* Mobile Drag Handle Bar */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto my-2.5 sm:hidden shrink-0" />

        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 sm:border-gray-200 shrink-0">
            {title && (
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">{title}</h3>
                {description && <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{description}</p>}
              </div>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-transform active:scale-90 shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>
            )}
          </div>
        )}
        <div className="px-5 sm:px-6 py-4 overflow-y-auto flex-1 overscroll-contain">{children}</div>
        {footer && (
          <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-gray-100 sm:border-gray-200 bg-white sm:bg-gray-50 pb-[max(0.875rem,env(safe-area-inset-bottom,0px))] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;