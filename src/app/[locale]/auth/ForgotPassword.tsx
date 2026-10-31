'use client';

// "Şifremi unuttum" (e-posta ile link iste) ve sıfırlama linkinden gelince "yeni şifre" formu.
// Supabase linki /<dil>/auth?mode=reset#access_token=…&type=recovery adresine döner.
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import styles from './auth.module.css';

export default function ForgotPassword({ mode, token, initialEmail, expired, onDone }: {
  mode: 'request' | 'reset'; token?: string; initialEmail?: string; expired?: boolean; onDone: () => void;
}) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [email, setEmail] = useState(initialEmail || '');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(expired ? t('reset_expired') : '');
  const [done, setDone] = useState(false);

  async function request() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError(t('error_fill_all')); return; }
    setBusy(true); setError('');
    const res = await fetch('/api/auth/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, locale }) }).catch(() => null);
    setBusy(false);
    if (res?.status === 429) { setError(t('error_too_many')); return; }
    if (!res?.ok) { setError(t('error_generic')); return; }
    setDone(true);
  }

  async function save() {
    if (pw.length < 8) { setError(t('reset_short')); return; }
    if (pw !== pw2) { setError(t('reset_mismatch')); return; }
    setBusy(true); setError('');
    const res = await fetch('/api/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ password: pw }) }).catch(() => null);
    setBusy(false);
    const data = await res?.json().catch(() => ({}));
    if (res?.ok) { setDone(true); return; }
    setError(data?.error === 'expired' ? t('reset_expired') : data?.error === 'weak' ? t('reset_weak') : data?.error === 'short' ? t('reset_short') : t('reset_failed'));
  }

  if (done) {
    return (
      <div className={styles.successMessage}>
        <div className={styles.successIcon}>{mode === 'request' ? '📬' : '✅'}</div>
        <h2 className={styles.successTitle}>{mode === 'request' ? t('forgot_sent_title') : t('reset_done_title')}</h2>
        <p className={styles.successSub}>{mode === 'request' ? t('forgot_sent', { email }) : t('reset_done')}</p>
        <button className={styles.btnSubmit} onClick={onDone}>{t('forgot_back')}</button>
      </div>
    );
  }

  const expiredLink = mode === 'reset' && (expired || !token);
  return (
    <>
      <h1 className={styles.authTitle}>{mode === 'request' || expiredLink ? t('forgot_title') : t('reset_title')}</h1>
      <p className={styles.authSub}>{mode === 'request' || expiredLink ? t('forgot_text') : t('reset_text')}</p>
      <div className={styles.authForm}>
        {error && <div className={styles.errorMsg}>{error}</div>}
        {mode === 'request' || expiredLink ? (
          <>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="fp-email">{t('email_label')}</label>
              <input id="fp-email" className={styles.formInput} type="email" autoComplete="email" placeholder={t('email_placeholder')} value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && request()} />
            </div>
            <button className={styles.btnSubmit} onClick={request} disabled={busy}>{busy ? '…' : t('forgot_send')}</button>
          </>
        ) : (
          <>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="fp-pw">{t('reset_new')}</label>
              <input id="fp-pw" className={styles.formInput} type="password" autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="fp-pw2">{t('reset_repeat')}</label>
              <input id="fp-pw2" className={styles.formInput} type="password" autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} />
            </div>
            <button className={styles.btnSubmit} onClick={save} disabled={busy}>{busy ? '…' : t('reset_save')}</button>
          </>
        )}
        <button type="button" className={styles.forgotLink} style={{ background: 'none', border: 0, cursor: 'pointer', alignSelf: 'center', font: 'inherit' }} onClick={onDone}>← {t('forgot_back')}</button>
      </div>
    </>
  );
}
