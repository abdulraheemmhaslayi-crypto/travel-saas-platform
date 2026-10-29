import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ToastProvider from '@/components/ui/ToastProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TravelFlow - Travel Made Simple',
  description: 'Book trips, track rides, and manage your journeys all in one place.',
  keywords: ['travel', 'booking', 'trips', 'transport', 'rideshare'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}