import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.cvzume.com'),
  title: { default: 'CVzume', template: '%s | CVzume' },
  description: 'AI-powered CV and cover letter builder for the Swedish job market.',
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
    shortcut: '/favicon.png',
    apple: [{ url: '/favicon.png', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
