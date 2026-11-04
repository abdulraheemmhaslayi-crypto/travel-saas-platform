import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Join travelers, drivers, and fleet owners across Kokan and Maharashtra with Kokan Travel.',
  openGraph: {
    title: 'Create Account | Kokan Travel',
    description: 'Join travelers, drivers, and fleet owners across Kokan and Maharashtra with Kokan Travel.',
    images: [
      {
        url: '/images/kokan-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Create Account on Kokan Travel',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create Account | Kokan Travel',
    description: 'Join travelers, drivers, and fleet owners across Kokan and Maharashtra with Kokan Travel.',
    images: ['/images/kokan-og-image.jpg'],
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
