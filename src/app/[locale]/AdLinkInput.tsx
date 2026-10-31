'use client';

// İlan linki alanı: linki /api/jobs/from-url'e gönderir, gelen metni üst bileşene verir.
// Landing demo'su ve NewApplicationModal kullanır.
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import styles from './adlink.module.css';

export type FetchedAd = { title: string; company: string; location: string; text: string; source: string };

export const isLoneUrl = (s: string) => /^https?:\/\/\S+$/i.test(s.trim());

export default function AdLinkInput({ onFetched, pastedUrl, generic = false, aside }: {
  onFetched: (ad: FetchedAd) => void;
  // Utanför Sverige: nämn inte Platsbanken i exempel/hint
  generic?: boolean;
  // Metin kutusuna tek başına bir link yapıştırılırsa üst bileşen bunu buraya iletir
  pastedUrl?: string;
  // Etiketin hemen yanında gösterilecek öğe (ör. "Açık ilanlarda arayın")
  aside?: React.ReactNode;
}) {
  const t = useTranslations('adlink');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function fetchAd(target: string) {
    if (!target.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/jobs/from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = ['invalid_url', 'blocked', 'fetch_failed', 'no_content', 'rate_limited'].includes(data.error) ? data.error : 'fetch_failed';
        setMsg({ ok: false, text: t(`errors.${code}`) });
        return;
      }
      onFetched(data as FetchedAd);
      setMsg({ ok: true, text: t('ok', { source: data.source === 'platsbanken' ? 'Platsbanken' : data.source }) });
    } catch {
      setMsg({ ok: false, text: t('errors.fetch_failed') });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!pastedUrl) return;
    setUrl(pastedUrl);
    fetchAd(pastedUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pastedUrl]);

  return (
    <div className={styles.wrap}>
      <div className={styles.labelRow}><label htmlFor="ad-link" className={styles.label}>{t('label')}</label>{aside}</div>
      <div className={styles.row}>
        <input
          id="ad-link"
          type="url"
          inputMode="url"
          className={styles.input}
          placeholder={t(generic ? 'placeholderGeneric' : 'placeholder')}
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); fetchAd(url); } }}
        />
        <button type="button" className={styles.btn} onClick={() => fetchAd(url)} disabled={loading || !url.trim()}>
          {loading ? t('loading') : t('button')}
        </button>
      </div>
      {msg
        ? <div className={msg.ok ? styles.ok : styles.err} role="status">{msg.text}</div>
        : <div className={styles.hint}>{t(generic ? 'hintGeneric' : 'hint')}</div>}
    </div>
  );
}
