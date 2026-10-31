import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CVzume — AI-powered CV builder for Swedish jobs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const TITLES: Record<string, { headline: string; sub: string }> = {
  sv: { headline: 'Skapa ditt CV med AI', sub: 'Anpassat till varje jobbannons · Gratis att börja' },
  en: { headline: 'Build your CV with AI', sub: 'Tailored to every job ad · Free to start' },
  es: { headline: 'Crea tu CV con IA', sub: 'Adaptado a cada oferta · Gratis para empezar' },
  tr: { headline: 'Yapay Zeka ile CV Oluştur', sub: 'Her ilana özel uyarlanmış · Ücretsiz başlayın' },
  de: { headline: 'Lebenslauf mit KI erstellen', sub: 'Für jede Stellenanzeige angepasst · Kostenlos starten' },
};

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="1" y="1" width="62" height="62" rx="15" fill="#0D1B2A" stroke="rgba(255,255,255,0.22)" stroke-width="2"/><rect x="14" y="16" width="22" height="30" rx="3.5" fill="#93C5FD" transform="rotate(-10 25 31)"/><rect x="27" y="17" width="22" height="30" rx="3.5" fill="#fff" transform="rotate(8 38 32)"/><g transform="rotate(8 38 32)" fill="#1A56DB"><rect x="31" y="24" width="12" height="2.8" rx="1.4"/><rect x="31" y="30" width="14" height="2.8" rx="1.4"/><rect x="31" y="36" width="9" height="2.8" rx="1.4"/></g></svg>`;

type Props = { params: Promise<{ locale: string }> };

export default async function Image({ params }: Props) {
  const { locale } = await params;
  const copy = TITLES[locale] ?? TITLES.sv;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0D1B2A 0%, #1a3a5c 60%, #1a56db 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* subtle grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        {/* logo */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 48 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/svg+xml;utf8,${encodeURIComponent(MARK)}`} width={68} height={68} alt="" style={{ marginRight: 18 }} />
          <span style={{ fontSize: 52, fontWeight: 800, color: 'white', letterSpacing: -2 }}>
            CV<span style={{ color: '#93C5FD' }}>zume</span>
          </span>
        </div>

        {/* headline */}
        <div style={{
          fontSize: 64,
          fontWeight: 800,
          color: 'white',
          textAlign: 'center',
          lineHeight: 1.1,
          letterSpacing: -2,
          maxWidth: 900,
          marginBottom: 24,
        }}>
          {copy.headline}
        </div>

        {/* sub */}
        <div style={{
          fontSize: 28,
          color: 'rgba(255,255,255,0.7)',
          textAlign: 'center',
          letterSpacing: 0,
        }}>
          {copy.sub}
        </div>

        {/* badge */}
        <div style={{
          marginTop: 48,
          background: 'rgba(26,86,219,0.4)',
          border: '1px solid rgba(147,197,253,0.3)',
          borderRadius: 50,
          padding: '12px 32px',
          fontSize: 22,
          color: '#93C5FD',
          fontWeight: 600,
        }}>
          cvzume.com
        </div>
      </div>
    ),
    { ...size }
  );
}
