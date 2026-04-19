'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

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

export default function ArchiveClient({ onNavigate }: { onNavigate?: (seg: string) => void }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('archive');

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

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
      setApps((data.applications || []).filter((a: Application) => a.status === 'rejected'));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [locale, router]);

  useEffect(() => { load(); }, [load]);

  async function restoreApp(id: string) {
    const token = localStorage.getItem('cvita_token');
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status: 'sent' }),
    });
    setApps(prev => prev.filter(a => a.id !== id));
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

  const card: React.CSSProperties = { background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 };
  const actionBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15, border: '1.5px solid var(--border)', background: 'white' };

  return (
    <main style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>{t('title')}</div>
        <div style={{ fontSize: 14, color: 'var(--slate)' }}>{t('subtitle', { count: apps.length })}</div>
      </div>

      {loading && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('loading')}</div>}

      {!loading && apps.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', border: '1px solid var(--border)', borderRadius: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>{t('empty_title')}</div>
          <div style={{ fontSize: 13, color: 'var(--slate)' }}>
            {t('empty_sub_pre')}{' '}
            <button onClick={() => goTo('skickade')} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'DM Sans, sans-serif', padding: 0 }}>
              {t('empty_sub_link')}
            </button>
            {' '}{t('empty_sub_post')}
          </div>
        </div>
      )}

      {!loading && apps.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {apps.map(app => (
            <div key={app.id} style={{ ...card, opacity: 0.9 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✗</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.role}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{t('rejected_label')} · {formatDate(app.created_at, locale)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <ScoreBadge score={app.match_score || 0} />
                <button onClick={() => restoreApp(app.id)} style={{ ...actionBtn, background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1A56DB', padding: '0 10px', width: 'auto', fontSize: 12, fontWeight: 600, fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
                  {t('restore_btn')}
                </button>
                <button onClick={() => deleteApp(app.id, app.role)} style={{ ...actionBtn, color: '#EF4444' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
