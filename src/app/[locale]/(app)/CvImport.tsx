'use client';

// "CV'ni yükle (PDF/Word)": dosyayı /api/cv/import'a gönderir, yapılandırılmış profili döner.
// Mitt CV sayfası ve "Ny ansökan" akışı kullanır.
import { authFetch } from '@/lib/auth-client';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Profile } from '@/lib/profile-store';

export type ImportedCv = Profile & { firstName?: string; lastName?: string };

export default function CvImport({ onImported, compact = false }: { onImported: (cv: ImportedCv) => void; compact?: boolean }) {
  const t = useTranslations('cvimport');
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(file: File) {
    setBusy(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await authFetch('/api/cv/import', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.profile) {
        const code = ['too_large', 'old_doc', 'unsupported', 'no_text', 'unauthorized', 'ai_failed'].includes(data.error) ? data.error : 'generic';
        setError(t(`errors.${code}`));
        return;
      }
      onImported(data.profile as ImportedCv);
    } catch {
      setError(t('errors.generic'));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div style={compact ? undefined : box}>
      {!compact && (
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: 15 }}>📄 {t('title')}</div>
          <div style={{ fontSize: 13, color: 'var(--slate)', marginTop: 4 }}>{t('desc')}</div>
        </div>
      )}
      <div>
        <button type="button" onClick={() => input.current?.click()} disabled={busy} style={btn}>
          {busy ? t('busy') : t('button')}
        </button>
        <input
          ref={input}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }}
        />
      </div>
      {error && <div style={{ width: '100%', color: '#B91C1C', fontSize: 13, marginTop: 8 }}>{error}</div>}
    </div>
  );
}

const box: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: 'var(--blue-light)', border: '1px solid var(--blue-pale)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 };
const btn: React.CSSProperties = { fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: 'white', background: 'var(--blue)', border: 'none', borderRadius: 9, padding: '10px 18px', cursor: 'pointer' };
