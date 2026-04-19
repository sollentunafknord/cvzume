import { useRef } from 'react';
import styles from './settings.module.css';

export default function PersonalTab({ firstName, setFirstName, lastName, setLastName, userEmail, initials, userName, saving, onSave, avatarUrl, avatarUploading, onAvatarUpload, t }: {
  firstName: string; setFirstName: (v: string) => void;
  lastName: string; setLastName: (v: string) => void;
  userEmail: string; initials: string; userName: string;
  saving: boolean; onSave: () => void;
  avatarUrl: string; avatarUploading: boolean; onAvatarUpload: (file: File) => void;
  t: (key: string) => string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.settingsCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderIcon}>👤</div>
        <div>
          <div className={styles.cardHeaderTitle}>{t('settings.personal')}</div>
          <div className={styles.cardHeaderDesc}>{t('settings.personal_desc')}</div>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper} onClick={() => fileInputRef.current?.click()} title={t('settings.avatar_upload')}>
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" className={styles.avatarImg} />
              : <div className={styles.avatarCircle}>{initials}</div>
            }
            <div className={styles.avatarOverlay}>
              {avatarUploading ? '⏳' : '📷'}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) onAvatarUpload(f); e.target.value = ''; }}
          />
          <div>
            <div className={styles.avatarName}>{userName || '–'}</div>
            <div className={styles.avatarEmail}>{userEmail}</div>
            <div className={styles.avatarHint}>{t('settings.avatar_hint')}</div>
          </div>
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('auth.firstname_label')}</label>
            <input className={styles.formInput} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Anna" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('auth.lastname_label')}</label>
            <input className={styles.formInput} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Lindström" />
          </div>
          <div className={styles.formGroup} style={{ gridColumn: '1/-1' }}>
            <label className={styles.formLabel}>{t('auth.email_label')}</label>
            <input className={styles.formInput} value={userEmail} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>
        </div>
        <div className={styles.formActions}>
          <button className={styles.btnPrimary} onClick={onSave} disabled={saving}>
            {saving ? '…' : t('settings.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
