'use client';

// "Länk eller text": ilanı herhangi bir siteden (Indeed, LinkedIn, şirket sayfası…) link ya da metin
// olarak yapıştır; CVzume okur ve "Ny ansökan" penceresini doldurulmuş açar. Indeed/LinkedIn'in açık
// API'si olmadığı için onları ayrıca listelemiyoruz — bu ekran onların yerine geçer.
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './applications.module.css';
import AdLinkInput, { isLoneUrl } from '../../AdLinkInput';

export default function LinkJobSearch() {
  const t = useTranslations('linksrc');
  const locale = useLocale();
  const router = useRouter();
  const [role, setRole] = useState('');
  const [ad, setAd] = useState('');
  const [pastedUrl, setPastedUrl] = useState('');

  function analyze() {
    if (ad.trim().length < 80) return;
    localStorage.setItem('cvita_prefill_job', JSON.stringify({ role: role.trim(), description: ad.slice(0, 6000) }));
    router.push(`/${locale}/dashboard`);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </div>

      <div className={styles.filters} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AdLinkInput
          pastedUrl={pastedUrl}
          generic
          onFetched={a => {
            setRole([a.title, a.company].filter(Boolean).join(' — '));
            setAd(a.text);
          }}
        />
        <input className={styles.searchInput} placeholder={t('role')} value={role} onChange={e => setRole(e.target.value)} />
        <textarea
          className={styles.searchInput}
          style={{ minHeight: 220, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
          placeholder={t('ad')}
          value={ad}
          maxLength={6000}
          onChange={e => setAd(e.target.value)}
          onPaste={e => {
            const text = e.clipboardData.getData('text');
            if (!ad.trim() && isLoneUrl(text)) { e.preventDefault(); setPastedUrl(text.trim()); }
          }}
        />
        <div>
          <button type="button" className={styles.searchBtn} onClick={analyze} disabled={ad.trim().length < 80}>{t('analyze')}</button>
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 16, lineHeight: 1.6 }}>💡 {t('tip')}</p>
    </div>
  );
}
