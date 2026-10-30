'use client';

// "Mina ansökningar": tüm başvurular tek listede (eskiden dashboard/Skickade/Intervju/Arkiv'e dağılmıştı).
// Durum filtresi, uyarlanmış CV ve brev'i tekrar indirme, durum değiştirme, mülakat hazırlığı, silme.
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import styles from '../ny/ny.module.css';
import PrintDocument from '../ny/PrintDocument';
import { loadProfile } from '@/lib/profile-store';
import { exportCvDocx, exportLetterDocx, safeFileName, type ExportCv, type ExportPerson } from '@/lib/export-docs';

type App = {
  id: string; role: string; status: string; created_at: string; match_score: number | null
  cover_letter: string | null; cv_summary: string | null; tailored_cv?: ExportCv | null
}

const STATUSES = ['draft', 'sent', 'interview', 'rejected'] as const
type Filter = 'all' | typeof STATUSES[number]

export default function AnsokningarClient({ onNavigate }: { onNavigate: (seg: string) => void }) {
  const t = useTranslations('mina');
  const tn = useTranslations('ny');
  const locale = useLocale();
  const [apps, setApps] = useState<App[] | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [person, setPerson] = useState<ExportPerson>({ name: '' });
  const [fallbackCv, setFallbackCv] = useState<ExportCv | null>(null);
  const [printing, setPrinting] = useState<{ kind: 'cv' | 'letter'; app: App } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('cvita_token');
    const user = JSON.parse(localStorage.getItem('cvita_user') || '{}');
    fetch(`/api/applications?token=${token}`).then(r => r.json()).then(d => setApps(d.applications || [])).catch(() => setApps([]));
    loadProfile(locale).then(p => {
      setPerson({ name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || '', email: user.email, phone: p.phone, location: p.location, title: p.title });
      setFallbackCv({ summary: p.summary, experiences: p.experiences, educations: p.educations, skills: p.skills, languages: p.languages });
    });
  }, [locale]);

  // Eski başvurularda tam uyarlanmış CV yok: kayıtlı CV + o başvurunun özeti
  const cvFor = (a: App): ExportCv | null =>
    a.tailored_cv ?? (fallbackCv ? { ...fallbackCv, summary: a.cv_summary || fallbackCv.summary } : null);

  async function setStatus(a: App, status: string) {
    setApps(list => list?.map(x => (x.id === a.id ? { ...x, status } : x)) ?? null);
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('cvita_token')}` },
      body: JSON.stringify({ id: a.id, status }),
    }).catch(() => {});
    if (status === 'interview') onNavigate('intervju');
  }

  async function remove(a: App) {
    if (!confirm(t('delete_confirm', { role: a.role }))) return;
    setApps(list => list?.filter(x => x.id !== a.id) ?? null);
    await fetch('/api/applications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('cvita_token')}` },
      body: JSON.stringify({ id: a.id }),
    }).catch(() => {});
  }

  function download(a: App, kind: 'cv' | 'letter', format: 'pdf' | 'docx') {
    const name = safeFileName(person.name, kind === 'cv' ? 'CV' : tn('letter_file'), a.role);
    const cv = cvFor(a);
    if (format === 'docx') {
      const labels = { profile: tn('cv.profile'), experience: tn('cv.experience'), education: tn('cv.education'), skills: tn('cv.skills'), languages: tn('cv.languages'), present: tn('cv.present') };
      if (kind === 'cv' && cv) exportCvDocx(person, cv, labels, name);
      if (kind === 'letter' && a.cover_letter) exportLetterDocx(person, a.cover_letter, name);
      return;
    }
    setPrinting({ kind, app: a });
    const old = document.title;
    setTimeout(() => { document.title = name; window.print(); document.title = old; setPrinting(null); }, 50);
  }

  const shown = (apps || []).filter(a => filter === 'all' || a.status === filter || (filter === 'draft' && !STATUSES.includes(a.status as typeof STATUSES[number])));
  const dateFmt = (d: string) => { try { return new Date(d).toLocaleDateString(locale === 'sv' ? 'sv-SE' : locale, { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; } };

  return (
    <main className={styles.main}>
      <div className={styles.topbar}>
        <span className={styles.topbarTitle}>{t('title')}</span>
        <button className={styles.primary} onClick={() => onNavigate('ny')}>+ {t('new')}</button>
      </div>
      <div className={styles.content}>
        <div className={styles.stepper}>
          {(['all', ...STATUSES] as Filter[]).map(f => (
            <li key={f} className={filter === f ? styles.stepActive : ''} style={{ cursor: 'pointer', paddingLeft: 14 }} onClick={() => setFilter(f)}>
              {t(`filter.${f}`)} ({(apps || []).filter(a => f === 'all' || a.status === f).length})
            </li>
          ))}
        </div>

        {apps === null && <div className={styles.loading}><span className={styles.spinner} /></div>}
        {apps !== null && shown.length === 0 && (
          <section className={styles.card}>
            <p className={styles.lead}>{t('empty')}</p>
            <div><button className={styles.primary} onClick={() => onNavigate('ny')}>+ {t('new')}</button></div>
          </section>
        )}

        {shown.map(a => (
          <section key={a.id} className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <div className={styles.roleName}>{a.role || '—'}</div>
                <div className={styles.cvMeta}>{dateFmt(a.created_at)}{a.match_score != null && ` · ${a.match_score}% ${tn('step3.match').toLowerCase()}`}</div>
              </div>
              <select className={styles.input} style={{ width: 'auto' }} value={STATUSES.includes(a.status as typeof STATUSES[number]) ? a.status : 'draft'} onChange={e => setStatus(a, e.target.value)} aria-label={t('status')}>
                {STATUSES.map(s => <option key={s} value={s}>{t(`filter.${s}`)}</option>)}
              </select>
            </div>
            <div className={styles.actions} style={{ marginTop: 0 }}>
              <div className={styles.exportBtns}>
                <span>CV:</span>
                <button onClick={() => download(a, 'cv', 'pdf')}>PDF</button>
                <button onClick={() => download(a, 'cv', 'docx')}>Word</button>
              </div>
              {a.cover_letter && (
                <div className={styles.exportBtns}>
                  <span>{tn('letter_file')}:</span>
                  <button onClick={() => download(a, 'letter', 'pdf')}>PDF</button>
                  <button onClick={() => download(a, 'letter', 'docx')}>Word</button>
                </div>
              )}
              {a.status === 'interview' && <button className={styles.linkBtn} onClick={() => onNavigate('intervju')}>🎯 {t('interview_prep')}</button>}
              <button className={styles.linkBtn} style={{ color: '#B91C1C', marginLeft: 'auto' }} onClick={() => remove(a)}>{t('delete')}</button>
            </div>
          </section>
        ))}
      </div>

      {printing && (
        <PrintDocument kind={printing.kind} person={person} cv={cvFor(printing.app)} letter={printing.app.cover_letter || ''} />
      )}
    </main>
  );
}
