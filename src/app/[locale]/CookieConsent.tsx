'use client';

// Çerez onay çubuğu (sadece Google Analytics kimliği tanımlıysa). "Kabul et" → GA yüklenir; "Reddet" → hiç yüklenmez.
// Seçim sitenin altındaki "Çerez ayarları" bağlantısıyla değiştirilebilir.
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CONSENT_KEY, GA_ID, OPEN_CONSENT_EVENT, clearGoogleAnalyticsCookies, gaAllowedHere, loadGoogleAnalytics, readConsent } from '@/lib/analytics-consent';

export default function CookieConsent() {
  const t = useTranslations('consent');
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!GA_ID || !gaAllowedHere()) return;
    const c = readConsent();
    if (c === 'granted') loadGoogleAnalytics();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    else if (!c) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  if (!GA_ID || !open) return null;
  const choose = (v: 'granted' | 'denied') => {
    try { localStorage.setItem(CONSENT_KEY, v); } catch { /* yok */ }
    if (v === 'granted') loadGoogleAnalytics(); else clearGoogleAnalyticsCookies();
    setOpen(false);
  };
  return (
    <div role="dialog" aria-live="polite" aria-label={t('title')} style={{
      position: 'fixed', zIndex: 300, left: 'max(16px, env(safe-area-inset-left, 0px))', right: 'max(16px, env(safe-area-inset-right, 0px))',
      bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', maxWidth: 560, margin: '0 auto', background: 'white', color: 'var(--navy)',
      border: '1px solid var(--border)', borderRadius: 18, boxShadow: '0 20px 50px -24px rgba(35,52,58,.45)', padding: '18px 20px',
      fontFamily: "'Lexend', system-ui, sans-serif", display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ fontWeight: 600, fontSize: 16 }}>🍪 {t('title')}</div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--slate)' }}>
        {t('text')} <a href={`/${locale}/legal/cookies`} style={{ color: 'var(--blue)' }}>{t('more')}</a>
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => choose('granted')} style={{ font: 'inherit', fontWeight: 600, fontSize: 15, background: 'var(--blue)', color: 'white', border: 0, borderRadius: 999, padding: '10px 20px', cursor: 'pointer' }}>{t('accept')}</button>
        <button onClick={() => choose('denied')} style={{ font: 'inherit', fontWeight: 600, fontSize: 15, background: 'white', color: 'var(--navy)', border: '1.5px solid var(--border)', borderRadius: 999, padding: '10px 20px', cursor: 'pointer' }}>{t('reject')}</button>
      </div>
    </div>
  );
}

/** Sitenin altındaki "Çerez ayarları" bağlantısı (GA yoksa görünmez). */
export function CookieSettingsLink({ className }: { className?: string }) {
  const t = useTranslations('consent');
  if (!GA_ID) return null;
  return <button type="button" className={className} style={{ background: 'none', border: 0, padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }} onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}>{t('settings')}</button>;
}
