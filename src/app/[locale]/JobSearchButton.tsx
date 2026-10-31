'use client';

// "Açık ilanlarda arayın: <kurum>" — ilan linki sorusunun hemen yanında. Ülkenin kamu iş kurumu
// uygulama içinde aranabiliyorsa iş arama sayfası o sekmeyle açılır, değilse kurumun sitesi yeni sekmede.
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { jobAgency, readCountryCookie, RETURN_KEY, type JobAgency } from '@/lib/market';
import styles from './adlink.module.css';

export default function JobSearchButton({ from = 'ny' }: { from?: 'ny' | 'akis' }) {
  const t = useTranslations('adlink');
  const locale = useLocale();
  const [agency, setAgency] = useState<JobAgency | null>(null);

  // Ülke çerezi sadece tarayıcıda okunur (sunucu çizimiyle uyuşmazlık olmasın diye effect'te)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setAgency(jobAgency(readCountryCookie(), locale)); }, [locale]);
  if (!agency) return null;

  if (agency.url) {
    return <a className={styles.search} href={agency.url} target="_blank" rel="noopener noreferrer">🔍 {t('search_in', { name: agency.name })} ↗</a>;
  }
  return (
    <a className={styles.search} href={`/${locale}/applications`} onClick={() => {
      try {
        localStorage.setItem('cvzume_job_source', agency.inApp!);
        localStorage.setItem(RETURN_KEY, from);
      } catch { /* yok */ }
    }}>🔍 {t('search_in', { name: agency.name })}</a>
  );
}
