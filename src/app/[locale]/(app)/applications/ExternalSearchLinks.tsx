'use client';

// Uygulama içi aramanın altında: aynı aramayı Indeed ve LinkedIn'de aç. İkisinin de herkese açık
// ilan API'si yok (Indeed kapattı, LinkedIn sadece iş ortaklarına), bu yüzden sonuçları içeride
// gösteremiyoruz; kelime ve yer önceden doldurulmuş linklerle yönlendiriyoruz.
import { useTranslations } from 'next-intl';

const MARKETS: Record<'SE' | 'DE' | 'ES', { indeed: string; linkedin: string }> = {
  SE: { indeed: 'se', linkedin: 'Sverige' },
  DE: { indeed: 'de', linkedin: 'Deutschland' },
  ES: { indeed: 'es', linkedin: 'España' },
};

export default function ExternalSearchLinks({ query, location, market }: { query: string; location: string; market: keyof typeof MARKETS }) {
  const t = useTranslations('external');
  const m = MARKETS[market];
  const q = query.trim();
  const l = location.trim();
  const indeed = `https://${m.indeed}.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}`;
  const linkedin = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l || m.linkedin)}`;

  return (
    <div style={wrap}>
      <span style={{ fontSize: 13, color: 'var(--slate)' }}>{q ? t('same_search', { q }) : t('also_search')}</span>
      <a href={indeed} target="_blank" rel="noopener noreferrer" style={{ ...btn, background: '#2164F3' }}>Indeed ↗</a>
      <a href={linkedin} target="_blank" rel="noopener noreferrer" style={{ ...btn, background: '#0A66C2' }}>LinkedIn ↗</a>
    </div>
  );
}

const wrap: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', margin: '20px 0 0', padding: '12px 16px', background: 'white', border: '1px solid var(--border)', borderRadius: 10 };
const btn: React.CSSProperties = { color: 'white', fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 8, textDecoration: 'none' };
