/**
 * useErrorHandler — React hook for component-level error handling
 *
 * Wraps parseApiError and provides:
 *  - handleError(error)  → shows a toast notification with the friendly message
 *  - fieldErrors         → per-field validation error map (for form fields)
 *  - clearFieldErrors()  → reset field errors
 *  - parseError(error)   → returns friendly string without showing toast (manual use)
 *
 * Usage:
 *   const { handleError, fieldErrors, clearFieldErrors } = useErrorHandler();
 *
 *   try {
 *     await someApiCall();
 *   } catch (err) {
 *     handleError(err);  // automatically shows a toast
 *   }
 *
 *   // For form fields:
 *   {fieldErrors.email && <p className="error">{fieldErrors.email}</p>}
 */

'use client';

import { useState, useCallback } from 'react';
import { useAppStore } from '@/store';
import {
  parseApiError,
  getFieldValidationErrors,
  parseApiErrorFull,
  FieldValidationErrors,
} from '@/lib/errorHandler';

// Re-export types so consumers don't need to import from errorHandler directly
export type { FieldValidationErrors };

interface UseErrorHandlerReturn {
  /** Show a toast with the friendly error message derived from the thrown error */
  handleError: (error: unknown) => void;
  /** Show a toast with an explicit message (bypasses parsing) */
  showError: (message: string) => void;
  /** Per-field validation errors extracted from the last 400/422 response */
  fieldErrors: FieldValidationErrors;
  /** Clear all field errors */
  clearFieldErrors: () => void;
  /** Parse an error to a friendly string without showing a toast */
  parseError: (error: unknown) => string;
  /** True if the last error was a network connectivity error */
  isNetworkError: boolean;
  /** HTTP status of the last API error, if any */
  lastStatus: number | undefined;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const { showToast } = useAppStore();
  const [fieldErrors, setFieldErrors] = useState<FieldValidationErrors>({});
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [lastStatus, setLastStatus] = useState<number | undefined>(undefined);

  const handleError = useCallback(
    (error: unknown) => {
      const parsed = parseApiErrorFull(error);

      // Update state
      setFieldErrors(parsed.fieldErrors);
      setIsNetworkError(parsed.isNetworkError);
      setLastStatus(parsed.status);

      // Show toast
      showToast(parsed.message, 'error');
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string) => {
      setFieldErrors({});
      showToast(message, 'error');
    },
    [showToast]
  );

  const clearFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const parseError = useCallback((error: unknown): string => {
    return parseApiError(error);
  }, []);

  return {
    handleError,
    showError,
    fieldErrors,
    clearFieldErrors,
    parseError,
    isNetworkError,
    lastStatus,
  };
}

// ─── Field Error Component Helper ─────────────────────────────────────────────

/**
 * Returns the error message for a specific field name from a fieldErrors map.
 * Returns undefined if no error exists for that field.
 *
 * Usage:
 *   const err = getFieldError(fieldErrors, 'email');
 *   {err && <span className="text-red-500 text-xs">{err}</span>}
 */
export function getFieldError(
  fieldErrors: FieldValidationErrors,
  fieldName: string
): string | undefined {
  return fieldErrors[fieldName];
}
