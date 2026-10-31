import type { Metadata } from 'next';
import AkisClient from './AkisClient';

// Yeni rehberli akışın test adresi: hiçbir yerden link yok, arama motorlarına kapalı (PLAN.md).
export const metadata: Metadata = { title: 'CVzume', robots: { index: false, follow: false } };

export default function Page() {
  return <AkisClient />;
}
