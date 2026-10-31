import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import ToastProvider from '@/components/ui/ToastProvider';
import MobileNav from '@/components/layout/MobileNav';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#2563eb',
};

export const metadata: Metadata = {
  title: 'TravelFlow - Travel Made Simple',
  description: 'Book trips, track rides, and manage your journeys all in one place.',
  keywords: ['travel', 'booking', 'trips', 'transport', 'rideshare'],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TravelFlow',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-50 text-gray-900 antialiased`}>
        {children}
        <ToastProvider />
        <MobileNav />
      </body>
    </html>
  );
}
