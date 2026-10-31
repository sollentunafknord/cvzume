'use client';

// Ayarlar → "CV-foto": CV'de profil resmi mi, ayrı bir CV fotoğrafı mı kullanılsın, yoksa fotoğraf hiç olmasın.
// Seçim profiles.cv_photo_url'de ('' = profil resmi, 'none' = yok, URL = ayrı fotoğraf).
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import styles from './settings.module.css';
import { CV_PHOTO_NONE, loadPhotoSettings, saveCvPhotoChoice, uploadPhoto } from '@/lib/profile-store';

type Mode = 'profile' | 'custom' | 'none';

export default function CvPhotoCard({ avatarUrl, onToast }: { avatarUrl: string; onToast: (msg: string, type?: 'success' | 'error') => void }) {
  const t = useTranslations('settings');
  const locale = useLocale();
  const fileRef = useRef<HTMLInputElement>(null);
  const [choice, setChoice] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadPhotoSettings().then(({ choice }) => {
      setChoice(choice);
      if (choice && choice !== CV_PHOTO_NONE) setCustomUrl(choice);
    });
  }, []);

  const mode: Mode = choice === CV_PHOTO_NONE ? 'none' : choice ? 'custom' : 'profile';

  async function save(next: string) {
    const prev = choice;
    setChoice(next);
    if (await saveCvPhotoChoice(next, locale)) onToast('✅ ' + t('cv_photo_saved'));
    else { setChoice(prev); onToast('❌ ' + t('cv_photo_error'), 'error'); }
  }

  async function upload(file: File) {
    if (file.size > 2 * 1024 * 1024) { onToast('❌ Max 2 MB', 'error'); return; }
    setBusy(true);
    try {
      const url = await uploadPhoto(file, 'cvphoto');
      setCustomUrl(url);
      await save(url);
    } catch {
      onToast('❌ ' + t('cv_photo_error'), 'error');
    } finally {
      setBusy(false);
    }
  }

  function pick(m: Mode) {
    if (m === 'profile') save('');
    else if (m === 'none') save(CV_PHOTO_NONE);
    else if (customUrl) save(customUrl);
    else fileRef.current?.click();
  }

  const preview = mode === 'none' ? '' : mode === 'custom' ? customUrl : avatarUrl;
  const option = (m: Mode, label: string, hint?: string) => (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', cursor: 'pointer' }}>
      <input type="radio" name="cvphoto" checked={mode === m} onChange={() => pick(m)} disabled={busy} style={{ marginTop: 3 }} />
      <span>
        <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{label}</span>
        {hint && <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)' }}>{hint}</span>}
      </span>
    </label>
  );

  return (
    <div className={styles.settingsCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderIcon}>🖼️</div>
        <div>
          <div className={styles.cardHeaderTitle}>{t('cv_photo_title')}</div>
          <div className={styles.cardHeaderDesc}>{t('cv_photo_desc')}</div>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 96, height: 96, borderRadius: 8, background: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>
            {preview ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : t('cv_photo_empty')}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            {option('profile', t('cv_photo_profile'), avatarUrl ? undefined : t('cv_photo_profile_none'))}
            {option('custom', t('cv_photo_custom'))}
            {mode === 'custom' && (
              <button type="button" className={styles.btnPrimary} style={{ marginLeft: 26, marginBottom: 6 }} onClick={() => fileRef.current?.click()} disabled={busy}>
                {busy ? '…' : t('cv_photo_upload')}
              </button>
            )}
            {option('none', t('cv_photo_off'))}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
      </div>
    </div>
  );
}
