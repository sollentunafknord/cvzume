import { useState } from 'react';
import styles from './profile.module.css';
import type { Experience } from './types';

export default function ExperienceSection({ experiences, onAdd, onRemove, open, onToggle }: {
  experiences: Experience[];
  onAdd: (exp: Omit<Experience, 'id'>) => void;
  onRemove: (id: number) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company: '', role: '', start: '', end: '', desc: '' });

  function submit() {
    if (!form.company || !form.role) { alert('Företag och roll är obligatoriska.'); return; }
    onAdd(form);
    setForm({ company: '', role: '', start: '', end: '', desc: '' });
    setShowForm(false);
  }

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHead} onClick={onToggle}>
        <div className={styles.sectionHeadLeft}>
          <div className={`${styles.sectionIcon} ${styles.siGreen}`}>💼</div>
          <div>
            <div className={styles.sectionHeadTitle}>Arbetslivserfarenhet</div>
            <div className={styles.sectionHeadSub}>{experiences.length} poster</div>
          </div>
        </div>
        <span className={styles.sectionToggle}>{open ? '▼' : '▶'}</span>
      </div>
      {open && (
        <div className={styles.sectionBody}>
          <div className={styles.expList}>
            {experiences.map(e => (
              <div key={e.id} className={styles.expItem}>
                <div className={styles.expItemHeader}>
                  <div>
                    <div className={styles.expRole}>{e.role}</div>
                    <div className={styles.expCompany}>{e.company}</div>
                    <div className={styles.expDates}>{e.start}{e.end ? ` – ${e.end}` : ''}</div>
                  </div>
                  <button className={styles.expRemove} onClick={() => onRemove(e.id)}>✕</button>
                </div>
                {e.desc && <div className={styles.expDesc}>{e.desc}</div>}
              </div>
            ))}
          </div>
          {showForm && (
            <div className={styles.miniForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Företag *</label>
                  <input className={styles.formInput} placeholder="t.ex. Spotify" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Roll / Titel *</label>
                  <input className={styles.formInput} placeholder="t.ex. Frontend-utvecklare" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Startdatum</label>
                  <input className={styles.formInput} placeholder="2022-01" value={form.start} onChange={e => setForm(p => ({ ...p, start: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Slutdatum</label>
                  <input className={styles.formInput} placeholder="2024-06 (eller nuvarande)" value={form.end} onChange={e => setForm(p => ({ ...p, end: e.target.value }))} />
                </div>
                <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                  <label className={styles.formLabel}>Beskrivning</label>
                  <textarea className={`${styles.formInput} ${styles.formTextarea}`} placeholder="Beskriv dina arbetsuppgifter..." value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} />
                </div>
              </div>
              <div className={styles.miniFormActions}>
                <button className={`${styles.btnSm} ${styles.btnSmCancel}`} onClick={() => setShowForm(false)}>Avbryt</button>
                <button className={`${styles.btnSm} ${styles.btnSmPrimary}`} onClick={submit}>＋ Lägg till</button>
              </div>
            </div>
          )}
          {!showForm && (
            <button className={styles.btnAdd} onClick={() => setShowForm(true)}>＋ Lägg till erfarenhet</button>
          )}
        </div>
      )}
    </div>
  );
}
