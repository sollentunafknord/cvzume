'use client';

// "Mina ansökningar": tüm başvurular tek listede (eskiden dashboard/Skickade/Intervju/Arkiv'e dağılmıştı).
// Durum filtresi, uyarlanmış CV ve brev'i tekrar indirme, durum değiştirme, mülakat hazırlığı, silme.
import { authFetch } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import styles from './ansokningar.module.css';
import PrintDocument from '../ny/PrintDocument';
import { loadCvPhoto, loadProfile } from '@/lib/profile-store';
import { cvText, docLang, exportCvDocx, exportLetterDocx, freeFooter, letterMeta, printPortal, safeFileName, type ExportCv, type ExportPerson } from '@/lib/export-docs';

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
  const [confirmDelete, setConfirmDelete] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('cvita_user') || '{}');
    authFetch('/api/applications').then(r => r.json()).then(d => setApps(d.applications || [])).catch(() => setApps([]));
    Promise.all([loadProfile(locale), loadCvPhoto()]).then(([p, photo]) => {
      setPerson({ name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || '', email: user.email, phone: p.phone, location: p.location, title: p.title, photo });
      setFallbackCv({ summary: p.summary, experiences: p.experiences, educations: p.educations, skills: p.skills, languages: p.languages });
    });
  }, [locale]);

  // Eski başvurularda tam uyarlanmış CV yok: kayıtlı CV + o başvurunun özeti
  const cvFor = (a: App): ExportCv | null =>
    a.tailored_cv ?? (fallbackCv ? { ...fallbackCv, summary: a.cv_summary || fallbackCv.summary } : null);

  async function setStatus(a: App, status: string) {
    setApps(list => list?.map(x => (x.id === a.id ? { ...x, status } : x)) ?? null);
    await authFetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, status }),
    }).catch(() => {});
    if (status === 'interview') onNavigate('intervju');
  }

  async function remove(a: App) {
    setConfirmDelete('');
    setApps(list => list?.filter(x => x.id !== a.id) ?? null);
    await authFetch('/api/applications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id }),
    }).catch(() => {});
  }

  // Ücretsiz planda belgenin altındaki ibare, belgenin kendi dilinde
  const footerFor = (text: string) => (localStorage.getItem('cvita_is_pro') === 'true' ? '' : freeFooter(docLang(text, locale)));

  function download(a: App, kind: 'cv' | 'letter', format: 'pdf' | 'docx') {
    const name = safeFileName(person.name, kind === 'cv' ? 'CV' : tn('letter_file'), a.role);
    const cv = cvFor(a);
    if (format === 'docx') {
      const labels = { profile: tn('cv.profile'), experience: tn('cv.experience'), education: tn('cv.education'), skills: tn('cv.skills'), languages: tn('cv.languages'), present: tn('cv.present') };
      if (kind === 'cv' && cv) exportCvDocx(person, cv, labels, name, { footer: footerFor(cvText(cv)) });
      if (kind === 'letter' && a.cover_letter) exportLetterDocx(person, a.cover_letter, name, { footer: footerFor(a.cover_letter), meta: letterMeta(docLang(a.cover_letter, locale), a.role, person.location) });
      return;
    }
    setPrinting({ kind, app: a });
    printPortal(name).finally(() => setPrinting(null));
  }

  const shown = (apps || []).filter(a => filter === 'all' || a.status === filter || (filter === 'draft' && !STATUSES.includes(a.status as typeof STATUSES[number])));
  const dateFmt = (d: string) => { try { return new Date(d).toLocaleDateString(locale === 'sv' ? 'sv-SE' : locale, { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; } };

  const counts = (f: Filter) => (apps || []).filter(a => f === 'all' || a.status === f || (f === 'draft' && !STATUSES.includes(a.status as typeof STATUSES[number]))).length;
  // Uyum halkası: aynı eşikler (akış): %70+ yeşil, %40–69 sarı, altı kırmızı
  const ring = (n: number) => {
    const c = n >= 70 ? '#6FBF98' : n >= 40 ? '#E9B866' : '#E99A86';
    return (
      <svg className={styles.score} viewBox="0 0 56 56" aria-label={`${n}%`}><circle cx="28" cy="28" r="23" fill="none" stroke="#E3E8E4" strokeWidth="6" />
        <circle cx="28" cy="28" r="23" fill="none" stroke={c} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(n / 100) * 144.5} 144.5`} transform="rotate(-90 28 28)" />
        <text x="28" y="33" textAnchor="middle" fontSize="13" fontWeight="600" fill="#23343A">{n}%</text></svg>
    );
  };

  return (
    <main className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>{t('title')}</h1>
          {apps !== null && <p className={styles.sub}>{t('count', { n: apps.length })}</p>}
        </div>
        <button className={styles.newBtn} onClick={() => onNavigate('ny')}>+ {t('new')}</button>
      </div>

      {apps !== null && apps.length > 0 && (
        <div className={styles.filters} role="group" aria-label={t('status')}>
          {(['all', ...STATUSES] as Filter[]).map(f => (
            <button key={f} className={styles.filter} aria-pressed={filter === f} onClick={() => setFilter(f)}>{t(`filter.${f}`)}<span>{counts(f)}</span></button>
          ))}
        </div>
      )}

      {apps === null && <div className={styles.loading}><span className={styles.spin} /></div>}
      {apps !== null && shown.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon} aria-hidden>📂</div>
          <p>{t('empty')}</p>
          <button className={styles.newBtn} onClick={() => onNavigate('ny')}>+ {t('new')}</button>
        </div>
      )}

      <div className={styles.list}>
        {shown.map(a => {
          const [title, company] = (a.role || '—').split(' — ');
          const st = STATUSES.includes(a.status as typeof STATUSES[number]) ? a.status : 'draft';
          return (
            <section key={a.id} className={styles.card}>
              <div className={styles.cardTop}>
                {a.match_score != null && ring(a.match_score)}
                <div className={styles.info}>
                  <h2 className={styles.role}>{title}</h2>
                  {company && <div className={styles.company}>{company}</div>}
                  <div className={styles.meta}>{dateFmt(a.created_at)}</div>
                </div>
                <select className={`${styles.status} ${styles['s_' + st]}`} value={st} onChange={e => setStatus(a, e.target.value)} aria-label={t('status')}>
                  {STATUSES.map(x => <option key={x} value={x}>{t(`filter.${x}`)}</option>)}
                </select>
              </div>
              <div className={styles.actions}>
                <span className={styles.group}>CV
                  <button className={styles.btn} onClick={() => download(a, 'cv', 'pdf')}>PDF</button>
                  <button className={styles.btn} onClick={() => download(a, 'cv', 'docx')}>Word</button>
                </span>
                {a.cover_letter && (
                  <span className={styles.group}>{tn('letter_file')}
                    <button className={styles.btn} onClick={() => download(a, 'letter', 'pdf')}>PDF</button>
                    <button className={styles.btn} onClick={() => download(a, 'letter', 'docx')}>Word</button>
                  </span>
                )}
                {st === 'interview' && <button className={styles.link} onClick={() => onNavigate('intervju')}>🎯 {t('interview_prep')}</button>}
                {confirmDelete === a.id ? (
                  <span className={styles.delete} style={{ cursor: 'default' }}>
                    {t('delete_confirm', { role: title })}{' '}
                    <button className={styles.link} style={{ color: 'var(--error)' }} onClick={() => remove(a)}>{t('delete')}</button>
                    <button className={styles.link} onClick={() => setConfirmDelete('')}>{t('cancel')}</button>
                  </span>
                ) : (
                  <button className={styles.delete} onClick={() => setConfirmDelete(a.id)}>{t('delete')}</button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {printing && (
        <PrintDocument kind={printing.kind} person={person} cv={cvFor(printing.app)} letter={printing.app.cover_letter || ''}
          footer={printing.kind === 'letter' ? footerFor(printing.app.cover_letter || '') : footerFor(cvText(cvFor(printing.app) ?? { summary: '', experiences: [], educations: [], skills: [], languages: [] }))}
          meta={printing.kind === 'letter' ? letterMeta(docLang(printing.app.cover_letter || '', locale), printing.app.role, person.location) : undefined} />
      )}
    </main>
  );
}
