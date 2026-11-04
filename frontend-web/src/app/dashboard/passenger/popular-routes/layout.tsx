import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Popular Routes & Transit Corridors',
  description:
    'Explore popular intercity routes across Kokan, Mumbai, Thane, Pune, Raigad, Ratnagiri, and Sindhudurg with real-time fares and verified drivers.',
  openGraph: {
    title: 'Popular Routes & Transit Corridors | Kokan Travel',
    description:
      'Explore popular intercity routes across Kokan, Mumbai, Thane, Pune, and Maharashtra with real-time fares and verified drivers.',
    images: [
      {
        url: '/images/kokan-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Popular Routes on Kokan Travel',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Popular Routes & Transit Corridors | Kokan Travel',
    description:
      'Explore popular intercity routes across Kokan, Mumbai, Thane, Pune, and Maharashtra.',
    images: ['/images/kokan-og-image.jpg'],
  },
};

export default function PopularRoutesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

