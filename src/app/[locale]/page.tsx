import type { Metadata } from 'next';
import { Landing, landingMetadata } from './landing';
import { marketFor } from '@/lib/market';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return landingMetadata((await params).locale);
}

// Ülke bilinmeyen ziyaretçinin (ve Googlebot'un) gördüğü pazar; diğerleri middleware ile /pazar/[market]
export default async function LocalePage({ params }: Props) {
  const { locale } = await params;
  return <Landing locale={locale} market={marketFor('', locale)} />;
}
