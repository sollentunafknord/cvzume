'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './settings.module.css';

export default function AccountTab({ onToast }: {
  onToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const t = useTranslations('settings');
  const locale = useLocale();
  const router = useRouter();
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function deleteAccount() {
    if (!deletePassword) { onToast(t('account_password_required'), 'error'); return; }
    if (!confirm('⚠️ Delete your account permanently? This CANNOT be undone.')) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('cvita_token');
      const res = await fetch('/api/auth/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: deletePassword }),
      });
      if (!res.ok) throw new Error(t('account_delete_failed'));
      localStorage.clear();
      router.push(`/${locale}/auth`);
    } catch (e: unknown) {
      onToast('❌ ' + (e instanceof Error ? e.message : t('account_delete_failed')), 'error');
    } finally { setDeleting(false); }
  }

  return (
    <div className={`${styles.settingsCard} ${styles.dangerCard}`}>
      <div className={`${styles.cardHeader} ${styles.dangerHeader}`}>
        <div className={`${styles.cardHeaderIcon} ${styles.dangerHeaderIcon}`}>🗑</div>
        <div>
          <div className={`${styles.cardHeaderTitle} ${styles.dangerTitle}`}>{t('account_title')}</div>
          <div className={styles.cardHeaderDesc}>{t('account_desc')}</div>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.dangerWarn}>
          <div className={styles.dangerWarnTitle}>{t('account_warning_title')}</div>
          <div className={styles.dangerWarnList}>
            <div>• {t('account_warning_cv')}</div>
            <div>• {t('account_warning_letters')}</div>
            <div>• {t('account_warning_photo')}</div>
            <div>• {t('account_warning_email')}</div>
          </div>
        </div>
        <div className={styles.formGroup} style={{ marginBottom: 20 }}>
          <label className={styles.formLabel}>{t('account_confirm_label')}</label>
          <input className={styles.formInput} type="password" placeholder={t('account_confirm_placeholder')}
            value={deletePassword} onChange={e => setDeletePassword(e.target.value)} />
        </div>
        <button className={`${styles.btnPrimary} ${styles.btnDanger}`} onClick={deleteAccount} disabled={deleting}>
          {deleting ? t('account_deleting') : t('account_delete_btn')}
        </button>
      </div>
    </div>
  );
}
