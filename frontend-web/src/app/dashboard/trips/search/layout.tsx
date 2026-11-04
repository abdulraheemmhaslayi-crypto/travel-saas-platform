import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Intercity Rides',
  description:
    'Search and compare intercity cab and bus rides across Kokan, Mumbai, Thane, Pune, and Maharashtra. Book seats directly with verified drivers.',
  openGraph: {
    title: 'Search Intercity Rides | Kokan Travel',
    description:
      'Search and compare intercity cab and bus rides across Kokan, Mumbai, Thane, Pune, and Maharashtra.',
    images: [
      {
        url: '/images/kokan-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Search Intercity Rides - Kokan Travel',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Search Intercity Rides | Kokan Travel',
    description:
      'Search and compare intercity cab and bus rides across Kokan, Mumbai, Thane, Pune, and Maharashtra.',
    images: ['/images/kokan-og-image.jpg'],
  },
};

export default function SearchTripsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

