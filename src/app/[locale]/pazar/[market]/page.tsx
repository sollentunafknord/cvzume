import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Landing, landingMetadata } from '../../landing';
import { routing } from '../../../../../middleware';
import type { Market } from '@/lib/market';

// Açılış sayfasının ülkeye göre varyantları. Doğrudan açılmaz: middleware.ts /[locale]'i buraya iç yönlendirir,
// /[locale]/pazar/... adresine gelen ziyaretçiyi /[locale]'e gönderir. Canonical /[locale].
const MARKETS: Market[] = ['se', 'local', 'intl'];

type Props = { params: Promise<{ locale: string; market: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap(locale => MARKETS.map(market => ({ locale, market })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return landingMetadata((await params).locale);
}

export default async function MarketLanding({ params }: Props) {
  const { locale, market } = await params;
  if (!MARKETS.includes(market as Market)) notFound();
  return <Landing locale={locale} market={market as Market} />;
}
