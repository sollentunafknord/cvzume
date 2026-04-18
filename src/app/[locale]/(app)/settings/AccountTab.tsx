'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './settings.module.css';

export default function AccountTab({ onToast }: {
  onToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const locale = useLocale();
  const router = useRouter();
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function deleteAccount() {
    if (!deletePassword) { onToast('Ange ditt lösenord', 'error'); return; }
    if (!confirm('⚠️ Delete your account permanently? This CANNOT be undone.')) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('cvita_token');
      const res = await fetch('/api/auth/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: deletePassword }),
      });
      if (!res.ok) throw new Error('Radering misslyckades');
      localStorage.clear();
      router.push(`/${locale}/auth`);
    } catch (e: unknown) {
      onToast('❌ ' + (e instanceof Error ? e.message : 'Fel'), 'error');
    } finally { setDeleting(false); }
  }

  return (
    <div className={`${styles.settingsCard} ${styles.dangerCard}`}>
      <div className={`${styles.cardHeader} ${styles.dangerHeader}`}>
        <div className={`${styles.cardHeaderIcon} ${styles.dangerHeaderIcon}`}>🗑</div>
        <div>
          <div className={`${styles.cardHeaderTitle} ${styles.dangerTitle}`}>Radera konto</div>
          <div className={styles.cardHeaderDesc}>Permanent borttagning av alla dina uppgifter</div>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.dangerWarn}>
          <div className={styles.dangerWarnTitle}>⚠️ Detta går inte att ångra</div>
          <div className={styles.dangerWarnList}>
            <div>• Ditt CV och all profilinformation raderas permanent</div>
            <div>• Dina personliga brev och analyser tas bort</div>
            <div>• Ditt profilfoto raderas</div>
            <div>• Din e-postadress blockeras från framtida registreringar</div>
          </div>
        </div>
        <div className={styles.formGroup} style={{ marginBottom: 20 }}>
          <label className={styles.formLabel}>Bekräfta med ditt lösenord</label>
          <input className={styles.formInput} type="password" placeholder="Ditt lösenord"
            value={deletePassword} onChange={e => setDeletePassword(e.target.value)} />
        </div>
        <button className={`${styles.btnPrimary} ${styles.btnDanger}`} onClick={deleteAccount} disabled={deleting}>
          {deleting ? 'Raderar...' : '🗑 Radera mitt konto permanent'}
        </button>
      </div>
    </div>
  );
}
