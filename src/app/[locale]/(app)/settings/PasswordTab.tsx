'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import styles from './settings.module.css';

function calcStrength(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export default function PasswordTab({ onToast }: {
  onToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const t = useTranslations();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwStrength, setPwStrength] = useState(0);
  const [saving, setSaving] = useState(false);

  const strengthLevels = [
    { w: '20%', color: '#EF4444', label: t('auth.strength_weak') },
    { w: '40%', color: '#F97316', label: t('auth.strength_weak') },
    { w: '60%', color: '#EAB308', label: t('auth.strength_medium') },
    { w: '80%', color: '#22C55E', label: t('auth.strength_strong') },
    { w: '100%', color: '#059669', label: t('auth.strength_strong') },
  ];
  const strengthLevel = pwStrength > 0 ? strengthLevels[Math.min(pwStrength - 1, 4)] : null;

  async function changePassword() {
    if (!currentPw) { onToast('Ange nuvarande lösenord', 'error'); return; }
    if (newPw.length < 8) { onToast(t('auth.error_password_short'), 'error'); return; }
    if (newPw !== confirmPw) { onToast('Lösenorden matchar inte', 'error'); return; }
    setSaving(true);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const user = JSON.parse(localStorage.getItem('cvita_user') || '{}');
    try {
      const verifyRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: supabaseKey },
        body: JSON.stringify({ email: user.email, password: currentPw }),
      });
      if (!verifyRes.ok) { onToast('Nuvarande lösenord är felaktigt', 'error'); return; }
      const { access_token } = await verifyRes.json();
      const updateRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: 'Bearer ' + access_token },
        body: JSON.stringify({ password: newPw }),
      });
      if (!updateRes.ok) throw new Error('Uppdatering misslyckades');
      setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwStrength(0);
      onToast('✅ Lösenord uppdaterat!');
    } catch (e: unknown) {
      onToast('❌ ' + (e instanceof Error ? e.message : 'Fel'), 'error');
    } finally { setSaving(false); }
  }

  return (
    <div className={styles.settingsCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderIcon}>🔒</div>
        <div>
          <div className={styles.cardHeaderTitle}>Byt lösenord</div>
          <div className={styles.cardHeaderDesc}>Välj ett starkt lösenord med minst 8 tecken</div>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.formGroup} style={{ marginBottom: 16 }}>
          <label className={styles.formLabel}>Nuvarande lösenord</label>
          <div className={styles.formInputWrap}>
            <input className={styles.formInput} type={showCurrentPw ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Ange nuvarande lösenord" />
            <button className={styles.pwToggle} onClick={() => setShowCurrentPw(p => !p)}>{showCurrentPw ? '🙈' : '👁'}</button>
          </div>
        </div>
        <div className={styles.formGroup} style={{ marginBottom: 16 }}>
          <label className={styles.formLabel}>Nytt lösenord</label>
          <div className={styles.formInputWrap}>
            <input className={styles.formInput} type={showNewPw ? 'text' : 'password'} value={newPw}
              onChange={e => { setNewPw(e.target.value); setPwStrength(calcStrength(e.target.value)); }}
              placeholder="Minst 8 tecken" />
            <button className={styles.pwToggle} onClick={() => setShowNewPw(p => !p)}>{showNewPw ? '🙈' : '👁'}</button>
          </div>
          {newPw && strengthLevel && (
            <>
              <div className={styles.pwStrengthBar}>
                <div className={styles.pwStrengthFill} style={{ width: strengthLevel.w, background: strengthLevel.color }} />
              </div>
              <div className={styles.pwStrengthLabel} style={{ color: strengthLevel.color }}>{strengthLevel.label}</div>
            </>
          )}
        </div>
        <div className={styles.formGroup} style={{ marginBottom: 16 }}>
          <label className={styles.formLabel}>Bekräfta nytt lösenord</label>
          <div className={styles.formInputWrap}>
            <input className={styles.formInput} type={showConfirmPw ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Upprepa nytt lösenord" />
            <button className={styles.pwToggle} onClick={() => setShowConfirmPw(p => !p)}>{showConfirmPw ? '🙈' : '👁'}</button>
          </div>
        </div>
        <div className={styles.formActions}>
          <button className={styles.btnPrimary} onClick={changePassword} disabled={saving}>
            {saving ? 'Sparar...' : 'Byt lösenord'}
          </button>
        </div>
      </div>
    </div>
  );
}
