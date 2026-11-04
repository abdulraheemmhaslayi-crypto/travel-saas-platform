import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Kokan Travel to manage your trips, bookings, and wallet.',
  openGraph: {
    title: 'Sign In | Kokan Travel',
    description: 'Sign in to Kokan Travel to manage your trips, bookings, and wallet.',
    images: [
      {
        url: '/images/kokan-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Sign In to Kokan Travel',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign In | Kokan Travel',
    description: 'Sign in to Kokan Travel to manage your trips, bookings, and wallet.',
    images: ['/images/kokan-og-image.jpg'],
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

