'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import styles from './dashboard.module.css';

const LANGS = [
  {
    code: 'sv',
    label: 'Svenska',
    flagImg: 'https://flagcdn.com/20x15/se.png',
    title: 'Välkommen till CVzume!',
    subtitle: 'Vilket språk söker du jobb på?',
    confirm: 'Kom igång →',
  },
  {
    code: 'en',
    label: 'English',
    flagImg: 'https://flagcdn.com/20x15/gb.png',
    title: 'Welcome to CVzume!',
    subtitle: 'Which language will you be applying in?',
    confirm: 'Get started →',
  },
  {
    code: 'es',
    label: 'Español',
    flagImg: 'https://flagcdn.com/20x15/es.png',
    title: '¡Bienvenido a CVzume!',
    subtitle: '¿En qué idioma vas a buscar trabajo?',
    confirm: 'Empezar →',
  },
  {
    code: 'tr',
    label: 'Türkçe',
    flagImg: 'https://flagcdn.com/20x15/tr.png',
    title: "CVzume'a Hoş Geldiniz!",
    subtitle: 'Hangi dilde iş başvurusu yapacaksınız?',
    confirm: 'Başlayalım →',
  },
];

interface Props {
  onComplete: (defaultLocale: string) => void;
}

export default function OnboardingModal({ onComplete }: Props) {
  const currentLocale = useLocale();
  const [selected, setSelected] = useState(currentLocale);

  const active = LANGS.find(l => l.code === selected) || LANGS[0];

  async function confirm() {
    localStorage.setItem('cvita_default_locale', selected);

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

    if (selected !== currentLocale) {
      document.cookie = `NEXT_LOCALE=${selected};path=/;max-age=31536000`;
      window.location.href = `/${selected}/dashboard`;
      return;
    }

    onComplete(selected);
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: 500 }}>
        <div style={{ padding: '28px 28px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>👋</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            Welcome · Välkommen · Bienvenido · Hoş Geldiniz
          </div>
        </div>

        <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {LANGS.map(lang => {
            const isSelected = selected === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => setSelected(lang.code)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  border: `2px solid ${isSelected ? 'var(--blue)' : 'var(--border)'}`,
                  borderRadius: 12,
                  background: isSelected ? 'var(--blue-light)' : 'white',
                  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  textAlign: 'left', width: '100%', transition: 'all 0.15s',
                }}
              >
                <img
                  src={lang.flagImg}
                  alt={lang.label}
                  style={{ width: 28, height: 21, borderRadius: 3, objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', lineHeight: 1.3 }}>
                    {lang.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>
                    {lang.subtitle}
                  </div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${isSelected ? 'var(--blue)' : 'var(--border)'}`,
                  background: isSelected ? 'var(--blue)' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isSelected && <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>✓</span>}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ padding: '20px 24px 28px' }}>
          <button
            onClick={confirm}
            style={{
              width: '100%', padding: '13px', borderRadius: 10, border: 'none',
              background: 'var(--blue)', color: 'white', fontSize: 15, fontWeight: 700,
              fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
            }}
          >
            {active.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
