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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://kokantravel.in'),
  title: {
    default: 'Kokan Travel - Intercity Rides & Fleet Booking Across Maharashtra',
    template: '%s | Kokan Travel',
  },
  description:
    'Book seats, compare intercity fares, track drivers live, and travel comfortably across Kokan, Mumbai, Thane, Pune, Raigad, Ratnagiri, and Maharashtra.',
  applicationName: 'Kokan Travel',
  keywords: [
    'Kokan Travel',
    'Kokan Tour',
    'Kokan cab booking',
    'intercity rides Maharashtra',
    'Dadar to Mhasla cab',
    'Thane to Dapoli cab',
    'Mumbai to Kokan carpool',
    'fleet management Kokan',
    'rideshare Kokan',
    'bus booking Kokan',
    'taxi service Maharashtra',
    'Alibaug',
    'Ratnagiri',
    'Sindhudurg',
    'Mhasla',
    'Dapoli',
  ],
  authors: [{ name: 'Kokan Travel Team', url: 'https://kokantravel.in' }],
  creator: 'Kokan Travel',
  publisher: 'Kokan Travel',
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://kokantravel.in',
    siteName: 'Kokan Travel',
    title: 'Kokan Travel - Intercity Rides & Fleet Booking Across Maharashtra',
    description:
      'Book seats, compare intercity fares, track drivers live, and travel comfortably across Kokan, Mumbai, Thane, Pune, and Maharashtra.',
    images: [
      {
        url: '/images/kokan-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Kokan Travel - Intercity Rides & Fleet Booking Across Maharashtra',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kokan Travel - Intercity Rides Across Maharashtra',
    description:
      'Book seats, compare intercity fares, track drivers live, and travel comfortably across Kokan, Mumbai, Thane, Pune, and Maharashtra.',
    images: ['/images/kokan-og-image.jpg'],
    creator: '@kokantravel',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/images/kokan-logo.png', type: 'image/png' },
    ],
    apple: [
      { url: '/images/kokan-logo.png' },
    ],
  },
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
