import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '—';
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    });
  } catch (e) {
    return '—';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return '—';
  }
}

export function formatCurrency(amount: number | string | undefined | null, currency?: string | null): string {
  const safeCurrency = currency && typeof currency === 'string' && currency.trim().length === 3 ? currency.trim().toUpperCase() : 'INR';
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : (Number(amount) || 0);
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: 2,
    }).format(num);
  } catch {
    return `₹${num.toFixed(2)}`;
  }
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => ReturnType<T> {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as any;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}


export function formatShortAddress(address: string): string {
  if (!address) return '';
  const first = address.split(',')[0]?.trim();
  return first || address;
}


export function getTripVehicleImage(vehicle?: any): string {
  if (!vehicle) return '/images/vehicles/comfort.png';
  const str = `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.type || ''}`.toLowerCase();
  if (str.includes('innova') || str.includes('xl') || str.includes('van') || (vehicle.seatingCapacity && vehicle.seatingCapacity > 5)) {
    return '/images/vehicles/xl.png';
  }
  if (str.includes('suv') || str.includes('fortuner') || str.includes('audi') || str.includes('creta')) {
    return '/images/vehicles/premium.png';
  }
  if (str.includes('camry') || str.includes('city') || str.includes('sedan') || str.includes('comfort')) {
    return '/images/vehicles/comfort.png';
  }
  return '/images/vehicles/economy.png';
}
