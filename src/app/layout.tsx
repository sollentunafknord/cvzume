import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.cvzume.com'),
  title: { default: 'CVzume', template: '%s | CVzume' },
  description: 'AI-powered CV and cover letter builder for the Swedish job market.',
  icons: {
    icon: [
      { url: '/icon', type: 'image/png', sizes: '32x32' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/apple-icon', type: 'image/png', sizes: '180x180' }],
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
