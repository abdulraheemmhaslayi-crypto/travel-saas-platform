import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import ToastProvider from '@/components/ui/ToastProvider';
import MobileNav from '@/components/layout/MobileNav';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#2563eb',
};

export const metadata: Metadata = {
  title: 'Kokan Travel - Travel Made Simple',
  description: 'Book trips, track rides, and manage your journeys all in one place across Kokan and beyond.',
  keywords: ['travel', 'booking', 'trips', 'transport', 'rideshare', 'kokan'],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kokan Travel',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className={`${plusJakarta.className} min-h-screen bg-slate-50 text-gray-900 antialiased`}>
        {children}
        <ToastProvider />
        <MobileNav />
      </body>
    </html>
  );
}
