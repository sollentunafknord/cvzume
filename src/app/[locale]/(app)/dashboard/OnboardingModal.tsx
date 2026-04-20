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
    hint: 'Detta blir ditt primära CV-språk. Pro-användare kan lägga till fler språk senare.',
    confirm: 'Kom igång →',
  },
  {
    code: 'en',
    label: 'English',
    flagImg: 'https://flagcdn.com/20x15/gb.png',
    title: 'Welcome to CVzume!',
    subtitle: 'Which language will you be applying in?',
    hint: 'This will be your primary CV language. Pro users can add more languages later.',
    confirm: 'Get started →',
  },
  {
    code: 'es',
    label: 'Español',
    flagImg: 'https://flagcdn.com/20x15/es.png',
    title: '¡Bienvenido a CVzume!',
    subtitle: '¿En qué idioma vas a buscar trabajo?',
    hint: 'Este será tu idioma principal de CV. Los usuarios Pro pueden añadir más idiomas después.',
    confirm: 'Empezar →',
  },
  {
    code: 'tr',
    label: 'Türkçe',
    flagImg: 'https://flagcdn.com/20x15/tr.png',
    title: "CVzume'a Hoş Geldiniz!",
    subtitle: 'Hangi dilde iş başvurusu yapacaksınız?',
    hint: 'Bu, birincil CV diliniz olacak. Pro kullanıcılar daha sonra dil ekleyebilir.',
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
      <div className={styles.modal} style={{ maxWidth: 480 }}>
        <div style={{ padding: '32px 32px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👋</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 8, transition: 'opacity 0.15s' }}>
            {active.title}
          </div>
          <div style={{ fontSize: 14, color: 'var(--slate)', marginBottom: 6 }}>{active.subtitle}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24 }}>{active.hint}</div>
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
              <img
                src={lang.flagImg}
                alt={lang.label}
                style={{ width: 28, height: 21, borderRadius: 3, objectFit: 'cover', flexShrink: 0 }}
              />
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
            {active.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
