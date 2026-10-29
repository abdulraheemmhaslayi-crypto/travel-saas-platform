/**
 * Centralized API Error Handler
 *
 * Single source of truth for converting raw API / network errors into
 * human-readable messages suitable for display to end-users.
 *
 * Usage:
 *   import { parseApiError, getFieldValidationErrors } from '@/lib/errorHandler';
 *
 *   // In an Axios interceptor or catch block:
 *   const message = parseApiError(error);
 *
 *   // For form validation (422 / 400 responses):
 *   const fieldErrors = getFieldValidationErrors(error);
 */

import type { AxiosError } from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiErrorPayload {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
  details?: unknown;
}

export interface FieldValidationErrors {
  [field: string]: string;
}

export interface ParsedApiError {
  message: string;
  status?: number;
  fieldErrors: FieldValidationErrors;
  isNetworkError: boolean;
}

// ─── HTTP Status → Friendly Message Map ─────────────────────────────────────

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: 'The information provided is invalid. Please review the form and try again.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested information could not be found.',
  405: 'This action is not supported.',
  408: 'The request took too long. Please try again.',
  409: 'This action could not be completed due to a conflict. Please refresh and try again.',
  410: 'This resource is no longer available.',
  422: 'Some fields have invalid values. Please review the form and try again.',
  429: 'Too many requests. Please wait a moment before trying again.',
  500: 'Something went wrong on our end. Please try again later.',
  502: 'The server is temporarily unavailable. Please try again later.',
  503: 'The service is currently down for maintenance. Please try again later.',
  504: 'The server took too long to respond. Please try again later.',
};

// ─── Domain Keyword → Friendly Message Map ───────────────────────────────────
// Each entry: [regex pattern to test against the raw backend message, friendly message]
// Patterns are tested in ORDER — put more specific patterns first.

type DomainRule = [pattern: RegExp, message: string];

const DOMAIN_ERROR_RULES: DomainRule[] = [
  // ── Booking / Seat ──────────────────────────────────────────────────────────
  [
    /seat.*(already\s+)?booked|seat.*(taken|unavailable|reserved)|booked.*seat/i,
    'This seat has already been booked by another passenger. Please choose a different seat.',
  ],
  [
    /all\s+seats?\s+(are\s+)?(full|booked|taken)|no\s+(available\s+)?seats?|trip.*full/i,
    'All seats for this trip are fully booked.',
  ],
  [
    /booking.*not\s+found|booking.*invalid/i,
    'This booking could not be found. It may have already been cancelled.',
  ],
  [
    /booking.*cancelled|cannot\s+cancel.*booking/i,
    'This booking has already been cancelled.',
  ],
  [
    /booking.*expired/i,
    'Your booking session has expired. Please start a new booking.',
  ],

  // ── Trip ────────────────────────────────────────────────────────────────────
  [
    /trip.*(cancelled|not\s+available|no\s+longer)/i,
    'This trip is no longer available.',
  ],
  [
    /trip.*not\s+found/i,
    'This trip could not be found. It may have been removed.',
  ],
  [
    /trip.*already\s+(started|in.progress|completed)/i,
    'This trip has already started or been completed.',
  ],
  [
    /booking.*not\s+allowed|allow.*booking.*false/i,
    'Online booking is not available for this trip.',
  ],

  // ── Payment ─────────────────────────────────────────────────────────────────
  [
    /payment.*(failed|declined|rejected|error)/i,
    'Payment could not be completed. Please try again or use a different payment method.',
  ],
  [
    /payment.*pending/i,
    'Your payment is still being processed. Please wait a few moments.',
  ],
  [
    /payment.*already\s+(completed|processed)/i,
    'This payment has already been processed.',
  ],
  [
    /insufficient.*funds?|balance.*low/i,
    'Insufficient wallet balance. Please add funds and try again.',
  ],
  [
    /invalid.*payment|payment.*invalid/i,
    'Invalid payment details. Please check and try again.',
  ],

  // ── Vehicle ─────────────────────────────────────────────────────────────────
  [
    /registration.*already\s+(exists?|taken|registered)|vehicle.*already\s+(exists?|registered)/i,
    'A vehicle with this registration number already exists.',
  ],
  [
    /vehicle.*pending|vehicle.*under\s+review/i,
    'Your vehicle has been submitted and is currently awaiting approval.',
  ],
  [
    /vehicle.*rejected/i,
    'This vehicle was not approved. Please review the details and resubmit.',
  ],
  [
    /vehicle.*not\s+found/i,
    'This vehicle could not be found.',
  ],
  [
    /vehicle.*suspended/i,
    'This vehicle has been suspended. Please contact support.',
  ],

  // ── KYC ─────────────────────────────────────────────────────────────────────
  [
    /kyc.*(already|submitted|pending|under\s+review)|verification.*already/i,
    'Your KYC verification request is already under review.',
  ],
  [
    /kyc.*(approved|verified)/i,
    'Your KYC verification has already been approved.',
  ],
  [
    /kyc.*(rejected|failed)/i,
    'Your KYC verification was rejected. Please resubmit with the correct documents.',
  ],
  [
    /document.*(missing|required|not\s+found|upload)/i,
    'Please upload all required documents before continuing.',
  ],

  // ── Authentication ───────────────────────────────────────────────────────────
  [
    /invalid.*(credentials?|password|email)|wrong.*(password|credentials?)|incorrect.*(password|credentials?)/i,
    'Incorrect email or password. Please try again.',
  ],
  [
    /account.*(inactive|deactivated|disabled)/i,
    'Your account is currently inactive. Please contact support.',
  ],
  [
    /account.*(suspended|blocked|banned)/i,
    'Your account has been suspended. Please contact support for assistance.',
  ],
  [
    /email.*(already\s+)?(exists?|taken|registered|in\s+use)/i,
    'An account with this email address already exists. Please log in instead.',
  ],
  [
    /phone.*(already\s+)?(exists?|taken|registered|in\s+use)/i,
    'This phone number is already registered. Please log in instead.',
  ],
  [
    /token.*(expired|invalid)|jwt.*(expired|invalid)|session.*(expired|invalid)/i,
    'Your session has expired. Please log in again.',
  ],
  [
    /refresh.*token.*(invalid|expired|not\s+found)/i,
    'Your session is no longer valid. Please log in again.',
  ],
  [
    /otp.*(invalid|expired|incorrect|wrong)/i,
    'The OTP you entered is incorrect or has expired. Please request a new one.',
  ],
  [
    /otp.*not\s+requested|otp.*not\s+found/i,
    'Please request an OTP first before verifying.',
  ],
  [
    /password.*(too\s+weak|requirements?)/i,
    'Your password is too weak. Please use at least 8 characters with a mix of letters and numbers.',
  ],
  [
    /password.*(mismatch|do\s+not\s+match|don.t\s+match)/i,
    'Passwords do not match. Please try again.',
  ],

  // ── Authorization ────────────────────────────────────────────────────────────
  [
    /not\s+authorized|unauthorized|access\s+denied/i,
    'You do not have permission to perform this action.',
  ],
  [
    /forbidden|not\s+allowed/i,
    'Access to this resource is not permitted.',
  ],

  // ── Fleet / Driver ───────────────────────────────────────────────────────────
  [
    /fleet.*(not\s+found|does\s+not\s+exist)/i,
    'This fleet could not be found.',
  ],
  [
    /driver.*(already\s+assigned|already\s+on\s+trip)/i,
    'This driver is already assigned to another trip.',
  ],
  [
    /driver.*(not\s+found|does\s+not\s+exist)/i,
    'This driver could not be found.',
  ],
  [
    /driver.*(not\s+approved|pending)/i,
    'This driver profile is still awaiting approval.',
  ],

  // ── Support Tickets ───────────────────────────────────────────────────────────
  [
    /ticket.*(not\s+found|does\s+not\s+exist)/i,
    'This support ticket could not be found.',
  ],
  [
    /ticket.*(already\s+closed|already\s+resolved)/i,
    'This support ticket has already been closed.',
  ],

  // ── Wallet ────────────────────────────────────────────────────────────────────
  [
    /wallet.*(not\s+found|does\s+not\s+exist)/i,
    'Wallet information could not be found.',
  ],

  // ── Generic / Catch-All ───────────────────────────────────────────────────────
  [
    /not\s+found/i,
    'The requested information could not be found.',
  ],
  [
    /conflict/i,
    'This action could not be completed because of a conflict. Please refresh and try again.',
  ],
  [
    /validation\s+(failed|error)|invalid\s+input/i,
    'Some fields have invalid values. Please review the form and try again.',
  ],
  [
    /duplicate|already\s+exists?/i,
    'A record with this information already exists.',
  ],
  [
    /permission|role|access/i,
    'You do not have permission to perform this action.',
  ],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the raw error message string(s) from a backend response payload.
 * NestJS may return `message` as a string or an array of validation strings.
 */
function extractBackendMessage(payload: ApiErrorPayload): string {
  if (!payload.message) return '';
  if (Array.isArray(payload.message)) {
    return payload.message.join(' ');
  }
  return payload.message;
}

/**
 * Returns true if a string looks like a human-readable sentence
 * (i.e. NOT a raw HTTP term like "Bad Request", "Unauthorized", etc.)
 */
const RAW_HTTP_JARGON = /^(bad\s+request|unauthorized|forbidden|not\s+found|conflict|unprocessable|internal\s+server\s+error|service\s+unavailable|gateway\s+timeout|\d{3})$/i;

function isHumanReadable(msg: string): boolean {
  if (!msg || msg.trim().length < 10) return false;
  if (RAW_HTTP_JARGON.test(msg.trim())) return false;
  // Contains HTTP status code pattern
  if (/^\d{3}\b/.test(msg.trim())) return false;
  return true;
}

/**
 * Apply domain rules to a raw backend message.
 * Returns the first matching friendly message, or null if no rule matches.
 */
function applyDomainRules(rawMessage: string): string | null {
  for (const [pattern, friendlyMessage] of DOMAIN_ERROR_RULES) {
    if (pattern.test(rawMessage)) {
      return friendlyMessage;
    }
  }
  return null;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Parse any thrown error (AxiosError, native Error, unknown) into a
 * user-friendly message string.
 *
 * Priority:
 *  1. Domain keyword match on backend message  (most specific)
 *  2. Backend message that is already human-readable (no HTTP jargon)
 *  3. HTTP status code → default friendly message
 *  4. Network error (no response)
 *  5. Request timeout
 *  6. Generic fallback
 */
export function parseApiError(error: unknown): string {
  // ── Axios errors ────────────────────────────────────────────────────────────
  if (isAxiosError(error)) {
    // Network error (no response received)
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return 'The request took too long. Please check your connection and try again.';
      }
      return 'Unable to connect to the server. Please check your internet connection.';
    }

    const status = error.response.status;
    const payload = error.response.data as ApiErrorPayload | undefined;
    const rawMessage = payload ? extractBackendMessage(payload) : '';

    // 1. Domain keyword match — most specific
    if (rawMessage) {
      const isSpecificSeatError = /^(Seat\s+\S+\s+is\s+already\s+booked|Seats\s+\S+\s+and\s+\S+\s+were\s+booked\s+by\s+another\s+passenger|Your\s+selected\s+seats\s+are\s+no\s+longer\s+available\.\s+Please\s+choose\s+different\s+seats\.)/i.test(rawMessage);
      if (!isSpecificSeatError) {
        const domainMessage = applyDomainRules(rawMessage);
        if (domainMessage) return domainMessage;
      }
    }

    // 2. Backend message — pass through if already human-readable
    if (rawMessage && isHumanReadable(rawMessage)) {
      // Capitalise first letter and ensure period at end
      const cleaned = rawMessage.charAt(0).toUpperCase() + rawMessage.slice(1);
      return cleaned.endsWith('.') ? cleaned : `${cleaned}.`;
    }

    // 3. HTTP status → friendly default
    const statusMessage = HTTP_STATUS_MESSAGES[status];
    if (statusMessage) return statusMessage;

    // 4. Unknown HTTP status
    return `An unexpected error occurred (${status}). Please try again.`;
  }

  // ── Native JS errors ─────────────────────────────────────────────────────────
  if (error instanceof Error) {
    // Already a friendly message from a previous parseApiError call
    if (error.message && isHumanReadable(error.message)) {
      return error.message;
    }
  }

  // ── Fallback ─────────────────────────────────────────────────────────────────
  return 'Something went wrong. Please try again.';
}

/**
 * Extract per-field validation errors from a 400/422 Axios response.
 * Returns a map of { fieldName: "friendly error message" }.
 *
 * Handles:
 *  - NestJS class-validator array: `{ message: ["email must be an email"] }`
 *  - Custom errors map: `{ errors: { email: ["Invalid email"] } }`
 */
export function getFieldValidationErrors(error: unknown): FieldValidationErrors {
  const result: FieldValidationErrors = {};

  if (!isAxiosError(error) || !error.response) return result;

  const status = error.response.status;
  if (status !== 400 && status !== 422) return result;

  const payload = error.response.data as ApiErrorPayload | undefined;
  if (!payload) return result;

  // Handle `errors` map format
  if (payload.errors && typeof payload.errors === 'object') {
    for (const [field, messages] of Object.entries(payload.errors)) {
      if (Array.isArray(messages) && messages.length > 0) {
        result[field] = friendlyValidationMessage(messages[0], field);
      }
    }
    return result;
  }

  // Handle NestJS class-validator array format
  if (Array.isArray(payload.message)) {
    for (const msg of payload.message) {
      // NestJS format: "fieldName must be a string", "fieldName should not be empty"
      const fieldMatch = msg.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s+(.+)$/);
      if (fieldMatch) {
        const [, field, constraint] = fieldMatch;
        result[field] = friendlyValidationMessage(constraint, field);
      }
    }
  }

  return result;
}

/**
 * Convert a raw class-validator constraint message into a friendly message.
 */
function friendlyValidationMessage(raw: string, field: string): string {
  const lc = raw.toLowerCase();

  if (/should not be empty|must not be empty|is required/.test(lc)) {
    return `${capitalize(field)} is required.`;
  }
  if (/must be an email|invalid email/.test(lc)) {
    return 'Please enter a valid email address.';
  }
  if (/must be a valid phone|phone.*invalid|invalid.*phone/.test(lc)) {
    return 'Please enter a valid phone number.';
  }
  if (/must be a number|must be numeric|is not a number/.test(lc)) {
    return `${capitalize(field)} must be a valid number.`;
  }
  if (/must be a string/.test(lc)) {
    return `${capitalize(field)} must be text.`;
  }
  if (/must be.*date|invalid.*date/.test(lc)) {
    return `${capitalize(field)} must be a valid date.`;
  }
  if (/must be longer than|min.*length|too short/.test(lc)) {
    return `${capitalize(field)} is too short.`;
  }
  if (/must be shorter than|max.*length|too long/.test(lc)) {
    return `${capitalize(field)} is too long.`;
  }
  if (/must match|pattern/.test(lc)) {
    return `${capitalize(field)} format is invalid.`;
  }
  if (/must be.*uuid/.test(lc)) {
    return `${capitalize(field)} is invalid.`;
  }

  // Capitalise and return as-is
  return capitalize(raw.endsWith('.') ? raw : `${raw}.`);
}

function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Type Guard ───────────────────────────────────────────────────────────────

function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}

// ─── Convenience: full parsed result ─────────────────────────────────────────

/**
 * Returns a fully structured error object with message, status, fieldErrors.
 * Useful when you need more than just the message string.
 */
export function parseApiErrorFull(error: unknown): ParsedApiError {
  const message = parseApiError(error);
  const fieldErrors = getFieldValidationErrors(error);

  const isNetworkError =
    isAxiosError(error) && !error.response;

  const status = isAxiosError(error)
    ? error.response?.status
    : undefined;

  return { message, status, fieldErrors, isNetworkError };
}
