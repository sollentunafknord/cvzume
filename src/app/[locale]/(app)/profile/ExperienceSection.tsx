'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import styles from './profile.module.css';
import type { Experience } from './types';

export default function ExperienceSection({ experiences, onAdd, onRemove, open, onToggle }: {
  experiences: Experience[];
  onAdd: (exp: Omit<Experience, 'id'>) => void;
  onRemove: (id: number) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations('experience');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company: '', role: '', start: '', end: '', desc: '' });

  function submit() {
    if (!form.company || !form.role) { alert(t('required_error')); return; }
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
            <div className={styles.sectionHeadTitle}>{t('title')}</div>
            <div className={styles.sectionHeadSub}>{t('count', { count: experiences.length })}</div>
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
                  <label className={styles.formLabel}>{t('field_company')}</label>
                  <input className={styles.formInput} placeholder={t('field_company_placeholder')} value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t('field_role')}</label>
                  <input className={styles.formInput} placeholder={t('field_role_placeholder')} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t('field_start')}</label>
                  <input className={styles.formInput} placeholder={t('field_start_placeholder')} value={form.start} onChange={e => setForm(p => ({ ...p, start: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t('field_end')}</label>
                  <input className={styles.formInput} placeholder={t('field_end_placeholder')} value={form.end} onChange={e => setForm(p => ({ ...p, end: e.target.value }))} />
                </div>
                <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                  <label className={styles.formLabel}>{t('field_desc')}</label>
                  <textarea className={`${styles.formInput} ${styles.formTextarea}`} placeholder={t('field_desc_placeholder')} value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} />
                </div>
              </div>
              <div className={styles.miniFormActions}>
                <button className={`${styles.btnSm} ${styles.btnSmCancel}`} onClick={() => setShowForm(false)}>{t('cancel')}</button>
                <button className={`${styles.btnSm} ${styles.btnSmPrimary}`} onClick={submit}>{t('add_btn')}</button>
              </div>
            </div>
          )}
          {!showForm && (
            <button className={styles.btnAdd} onClick={() => setShowForm(true)}>{t('add_entry')}</button>
          )}
        </div>
      )}
    </div>
  );
}
