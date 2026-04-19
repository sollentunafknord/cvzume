'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './skickade.module.css';

interface Application {
  id: string;
  role: string;
  match_score: number;
  status: string;
  created_at: string;
}

function formatDate(dateStr: string, locale: string) {
  const localeMap: Record<string, string> = { en: 'en-GB', es: 'es-ES', tr: 'tr-TR', sv: 'sv-SE' };
  return new Date(dateStr).toLocaleDateString(localeMap[locale] || 'sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ScoreBadge({ score }: { score: number }) {
  const bg = score >= 80 ? '#DCFCE7' : score >= 60 ? '#FEF9C3' : '#FEE2E2';
  const color = score >= 80 ? '#15803D' : score >= 60 ? '#854D0E' : '#991B1B';
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: bg, color, flexShrink: 0 }}>{score}%</span>;
}

export default function SkickadeClient({ onNavigate }: { onNavigate?: (seg: string) => void }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('skickade');

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [patching, setPatching] = useState<string | null>(null);

  function goTo(seg: string) {
    if (onNavigate) onNavigate(seg);
    else router.push(`/${locale}/${seg}`);
  }

  const load = useCallback(async () => {
    const token = localStorage.getItem('cvita_token');
    if (!token) { router.push(`/${locale}/auth`); return; }
    try {
      const res = await fetch(`/api/applications?token=${token}`);
      const data = await res.json();
      setApps((data.applications || []).filter((a: Application) => a.status === 'sent'));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [locale, router]);

  useEffect(() => { load(); }, [load]);

  async function patchApp(id: string, status: string) {
    setPatching(id);
    const token = localStorage.getItem('cvita_token');
    try {
      await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status }),
      });
      setApps(prev => prev.filter(a => a.id !== id));
      if (status === 'interview') goTo('intervju');
    } finally { setPatching(null); }
  }

  async function deleteApp(id: string, role: string) {
    if (!confirm(t('delete_confirm', { role }))) return;
    const token = localStorage.getItem('cvita_token');
    await fetch('/api/applications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    setApps(prev => prev.filter(a => a.id !== id));
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle', { count: apps.length })}</p>
      </div>

      {loading && <div className={styles.loading}>{t('loading')}</div>}

      {!loading && apps.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📬</div>
          <div className={styles.emptyTitle}>{t('empty_title')}</div>
          <div className={styles.emptySub}>
            {t('empty_sub_pre')}{' '}
            <button className={styles.emptyLink} onClick={() => goTo('applications')}>{t('empty_sub_link')}</button>
            {' '}{t('empty_sub_post')}
          </div>
        </div>
      )}

      {!loading && apps.length > 0 && (
        <div className={styles.list}>
          {apps.map(app => (
            <div key={app.id} className={styles.card}>
              <div className={styles.cardInfo}>
                <div className={styles.cardRole}>{app.role}</div>
                <div className={styles.cardMeta}>{t('sent_date', { date: formatDate(app.created_at, locale) })}</div>
              </div>
              <div className={styles.cardActions}>
                <ScoreBadge score={app.match_score || 0} />
                <button className={`${styles.btnPositiv} ${patching === app.id ? styles.btnDisabled : ''}`} disabled={patching === app.id} onClick={() => patchApp(app.id, 'interview')}>
                  {t('positive_btn')}
                </button>
                <button className={`${styles.btnNegativ} ${patching === app.id ? styles.btnDisabled : ''}`} disabled={patching === app.id} onClick={() => patchApp(app.id, 'rejected')}>
                  {t('negative_btn')}
                </button>
                <button className={styles.btnDelete} onClick={() => deleteApp(app.id, app.role)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
