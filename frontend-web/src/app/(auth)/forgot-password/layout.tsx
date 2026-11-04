import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your Kokan Travel password securely via email or phone OTP.',
  openGraph: {
    title: 'Forgot Password | Kokan Travel',
    description: 'Reset your Kokan Travel password securely via email or phone OTP.',
    images: [
      {
        url: '/images/kokan-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Forgot Password - Kokan Travel',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Forgot Password | Kokan Travel',
    description: 'Reset your Kokan Travel password securely via email or phone OTP.',
    images: ['/images/kokan-og-image.jpg'],
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
