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
};

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
