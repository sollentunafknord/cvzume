import { useState } from 'react';
import styles from './profile.module.css';
import type { Education } from './types';

export default function EducationSection({ educations, onAdd, onRemove, open, onToggle }: {
  educations: Education[];
  onAdd: (edu: Omit<Education, 'id'>) => void;
  onRemove: (id: number) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ school: '', degree: '', field: '', years: '' });

  function submit() {
    if (!form.school) { alert('Skola är obligatorisk.'); return; }
    onAdd(form);
    setForm({ school: '', degree: '', field: '', years: '' });
    setShowForm(false);
  }

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHead} onClick={onToggle}>
        <div className={styles.sectionHeadLeft}>
          <div className={`${styles.sectionIcon} ${styles.siAmber}`}>🎓</div>
          <div>
            <div className={styles.sectionHeadTitle}>Utbildning</div>
            <div className={styles.sectionHeadSub}>{educations.length} poster</div>
          </div>
        </div>
        <span className={styles.sectionToggle}>{open ? '▼' : '▶'}</span>
      </div>
      {open && (
        <div className={styles.sectionBody}>
          <div className={styles.expList}>
            {educations.map(e => (
              <div key={e.id} className={styles.expItem}>
                <div className={styles.expItemHeader}>
                  <div>
                    <div className={styles.expRole}>{e.degree}{e.field ? ` · ${e.field}` : ''}</div>
                    <div className={styles.expCompany}>{e.school}</div>
                    <div className={styles.expDates}>{e.years}</div>
                  </div>
                  <button className={styles.expRemove} onClick={() => onRemove(e.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
          {showForm && (
            <div className={styles.miniForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Skola / Universitet *</label>
                  <input className={styles.formInput} placeholder="t.ex. KTH" value={form.school} onChange={e => setForm(p => ({ ...p, school: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Examen</label>
                  <input className={styles.formInput} placeholder="t.ex. Kandidatexamen" value={form.degree} onChange={e => setForm(p => ({ ...p, degree: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Inriktning</label>
                  <input className={styles.formInput} placeholder="t.ex. Datateknik" value={form.field} onChange={e => setForm(p => ({ ...p, field: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>År</label>
                  <input className={styles.formInput} placeholder="2018–2021" value={form.years} onChange={e => setForm(p => ({ ...p, years: e.target.value }))} />
                </div>
              </div>
              <div className={styles.miniFormActions}>
                <button className={`${styles.btnSm} ${styles.btnSmCancel}`} onClick={() => setShowForm(false)}>Avbryt</button>
                <button className={`${styles.btnSm} ${styles.btnSmPrimary}`} onClick={submit}>＋ Lägg till</button>
              </div>
            </div>
          )}
          {!showForm && (
            <button className={styles.btnAdd} onClick={() => setShowForm(true)}>＋ Lägg till utbildning</button>
          )}
        </div>
      )}
    </div>
  );
}
