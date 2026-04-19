'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import styles from './dashboard.module.css';

const LANGS = [
  { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
];

interface Props {
  onComplete: (defaultLocale: string) => void;
}

export default function OnboardingModal({ onComplete }: Props) {
  const t = useTranslations('onboarding');
  const currentLocale = useLocale();
  const [selected, setSelected] = useState(currentLocale);

  async function confirm() {
    // Save to localStorage
    localStorage.setItem('cvita_default_locale', selected);

    // Save to Supabase user metadata
    const token = localStorage.getItem('cvita_token');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (token) {
      fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: 'Bearer ' + token },
        body: JSON.stringify({ data: { default_locale: selected } }),
      }).catch(() => {});
    }

    // If selected language differs from current app locale, switch
    if (selected !== currentLocale) {
      document.cookie = `NEXT_LOCALE=${selected};path=/;max-age=31536000`;
      window.location.href = `/${selected}/dashboard`;
      return;
    }

    onComplete(selected);
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: 480 }}>
        <div style={{ padding: '32px 32px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👋</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>{t('title')}</div>
          <div style={{ fontSize: 14, color: 'var(--slate)', marginBottom: 6 }}>{t('subtitle')}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24 }}>{t('hint')}</div>
        </div>

        <div style={{ padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {LANGS.map(lang => (
            <button
              key={lang.code}
              onClick={() => setSelected(lang.code)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px',
                border: `2px solid ${selected === lang.code ? 'var(--blue)' : 'var(--border)'}`,
                borderRadius: 12, background: selected === lang.code ? 'var(--blue-light)' : 'white',
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', textAlign: 'left', width: '100%',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 26 }}>{lang.flag}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)' }}>{lang.label}</span>
              {selected === lang.code && <span style={{ marginLeft: 'auto', color: 'var(--blue)', fontWeight: 700 }}>✓</span>}
            </button>
          ))}
        </div>

        <div style={{ padding: '24px 32px 32px' }}>
          <button
            onClick={confirm}
            style={{
              width: '100%', padding: '13px', borderRadius: 10, border: 'none',
              background: 'var(--blue)', color: 'white', fontSize: 15, fontWeight: 700,
              fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
            }}
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
