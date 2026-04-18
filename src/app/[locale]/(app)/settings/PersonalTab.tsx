import styles from './settings.module.css';

export default function PersonalTab({ firstName, setFirstName, lastName, setLastName, userEmail, initials, userName, saving, onSave, t }: {
  firstName: string; setFirstName: (v: string) => void;
  lastName: string; setLastName: (v: string) => void;
  userEmail: string; initials: string; userName: string;
  saving: boolean; onSave: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className={styles.settingsCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderIcon}>👤</div>
        <div>
          <div className={styles.cardHeaderTitle}>Personlig information</div>
          <div className={styles.cardHeaderDesc}>Uppdatera ditt namn och e-postadress</div>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarCircle}>{initials}</div>
          <div>
            <div className={styles.avatarName}>{userName || 'Namn Efternamn'}</div>
            <div className={styles.avatarEmail}>{userEmail}</div>
          </div>
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Förnamn</label>
            <input className={styles.formInput} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Anna" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Efternamn</label>
            <input className={styles.formInput} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Lindström" />
          </div>
          <div className={styles.formGroup} style={{ gridColumn: '1/-1' }}>
            <label className={styles.formLabel}>E-postadress</label>
            <input className={styles.formInput} value={userEmail} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>
        </div>
        <div className={styles.formActions}>
          <button className={styles.btnPrimary} onClick={onSave} disabled={saving}>
            {saving ? 'Sparar...' : t('settings.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
