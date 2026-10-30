'use client';

// "Ny ansökan" — ürünün ana akışı, 4 adım:
// 1) İlan (link/metin, ya da uygulama içi aramadan gelen)  2) CV (kayıtlı, PDF/Word yükle, ya da elle)
// 3) Uyum + ilana uyarlanmış CV (düzenlenebilir) → PDF/Word  4) İsteğe bağlı personligt brev → PDF/Word
// Taslak (ilan) sessionStorage'da durur ki kullanıcı "Mitt CV"ye gidip dönünce kaybolmasın.
import { authFetch } from '@/lib/auth-client';
import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import styles from './ny.module.css';
import PrintDocument from './PrintDocument';
import AdLinkInput, { isLoneUrl } from '../../AdLinkInput';
import CvImport, { type ImportedCv } from '../CvImport';
import { hasCvContent, loadProfile, saveProfile, type Profile } from '@/lib/profile-store';
import { descLines, exportCvDocx, exportLetterDocx, period, safeFileName, type ExportCv, type ExportPerson } from '@/lib/export-docs';

type Step = 1 | 2 | 3 | 4;
type Requirement = { text: string; met: boolean };
type Tailored = { role: string; matchScore: number | null; requirements: Requirement[]; tips: string[]; cv: Profile };

const DRAFT_KEY = 'cvzume_ny_draft';

export default function NyAnsokanClient({ onNavigate }: { onNavigate: (seg: string) => void }) {
  const t = useTranslations('ny');
  const locale = useLocale();

  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState('');
  const [ad, setAd] = useState('');
  const [pastedUrl, setPastedUrl] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [person, setPerson] = useState<ExportPerson>({ name: '' });
  const [busy, setBusy] = useState<'' | 'tailor' | 'letter'>('');
  const [error, setError] = useState('');
  const [limitHit, setLimitHit] = useState(false);
  const [result, setResult] = useState<Tailored | null>(null);
  const [letter, setLetter] = useState('');
  const [appId, setAppId] = useState('');
  const [printing, setPrinting] = useState<'' | 'cv' | 'letter'>('');

  // Taslak + uygulama içi aramadan / landing demosundan gelen ilan
  useEffect(() => {
    let draft: { role?: string; ad?: string } = {};
    try { draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}'); } catch { /* yok */ }
    try {
      const prefill = localStorage.getItem('cvita_prefill_job');
      if (prefill) {
        const p = JSON.parse(prefill);
        draft = { role: p.role || '', ad: p.description || '' };
        localStorage.removeItem('cvita_prefill_job');
      }
    } catch { /* bozuk */ }
    /* eslint-disable react-hooks/set-state-in-effect */
    if (draft.ad) { setAd(draft.ad); setRole(draft.role || ''); }
    /* eslint-enable react-hooks/set-state-in-effect */
    const user = JSON.parse(localStorage.getItem('cvita_user') || '{}');
    loadProfile(locale).then(p => {
      setProfile(p);
      setPerson({ name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || '', email: user.email, phone: p.phone, location: p.location, title: p.title });
    });
  }, [locale]);

  useEffect(() => {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ role, ad })); } catch { /* özel mod */ }
  }, [role, ad]);

  const cvLabels = { profile: t('cv.profile'), experience: t('cv.experience'), education: t('cv.education'), skills: t('cv.skills'), languages: t('cv.languages'), present: t('cv.present') };
  const fileBase = (kind: string) => safeFileName(person.name, kind, result?.role || role);

  // ── 2 → 3: uyarlama ──
  async function tailor(cv: Profile) {
    setError('');
    setLimitHit(false);
    setBusy('tailor');
    setStep(3);
    try {
      const res = await authFetch('/api/ai/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobAd: ad, cv, locale }),
      });
      // Kota sunucuda sayılır; hak bitmişse 402
      if (res.status === 402) { setLimitHit(true); setStep(2); return; }
      const data = await res.json();
      if (!res.ok) throw new Error();
      const tailored: Tailored = { role: data.role || role, matchScore: data.matchScore, requirements: data.requirements || [], tips: data.tips || [], cv: { ...cv, ...data.cv } };
      setResult(tailored);
      if (!role && data.role) setRole(data.role);
      saveApplication(tailored);
    } catch {
      setError(t('errors.ai'));
      setStep(2);
    } finally {
      setBusy('');
    }
  }

  async function saveApplication(r: Tailored) {
    const token = localStorage.getItem('cvita_token');
    if (!token) return;
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: token, role: role || r.role, jobAd: ad, matchScore: r.matchScore,
          cvSummary: r.cv.summary, keyRequirements: r.requirements.map(q => q.text), tips: r.tips,
          tailoredCv: r.cv, provider: 'tailor',
        }),
      });
      const data = await res.json();
      if (data.application?.id) setAppId(data.application.id);
    } catch { /* kayıt olmasa da indirme çalışır */ }
  }

  // Kullanıcının düzenlemeleri indirme anında başvuruya yazılır
  const persist = useCallback((fields: { tailoredCv?: Profile; cvSummary?: string; coverLetter?: string }) => {
    const token = localStorage.getItem('cvita_token');
    if (!token || !appId) return;
    fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: appId, ...fields }),
    }).catch(() => {});
  }, [appId]);

  function updateCv(patch: Partial<Profile>) {
    setResult(r => (r ? { ...r, cv: { ...r.cv, ...patch } } : r));
  }

  async function onImport(cv: ImportedCv) {
    if (hasCvContent(profile) && !confirm(t('step2.confirm_replace'))) return;
    const next: Profile = { phone: cv.phone, location: cv.location, title: cv.title, summary: cv.summary, experiences: cv.experiences, educations: cv.educations, skills: cv.skills, languages: cv.languages };
    await saveProfile(locale, next, { firstName: cv.firstName, lastName: cv.lastName });
    setProfile(next);
    setPerson(p => ({ ...p, name: [cv.firstName, cv.lastName].filter(Boolean).join(' ') || p.name, phone: next.phone, location: next.location, title: next.title }));
  }

  async function makeLetter() {
    if (!result) return;
    setStep(4);
    if (letter) return;
    setBusy('letter');
    setError('');
    try {
      const res = await authFetch('/api/ai/letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobAd: ad, cv: result.cv, name: person.name, locale }),
      });
      const data = await res.json();
      if (!res.ok || !data.letter) throw new Error();
      setLetter(data.letter);
      persist({ coverLetter: data.letter });
    } catch {
      setError(t('errors.ai'));
    } finally {
      setBusy('');
    }
  }

  function exportCv(format: 'pdf' | 'docx') {
    if (!result) return;
    persist({ tailoredCv: result.cv, cvSummary: result.cv.summary });
    const cv: ExportCv = { summary: result.cv.summary, experiences: result.cv.experiences, educations: result.cv.educations, skills: result.cv.skills, languages: result.cv.languages };
    if (format === 'docx') exportCvDocx({ ...person, title: result.cv.title || person.title }, cv, cvLabels, fileBase('CV'));
    else printDoc('cv', fileBase('CV'));
  }

  function exportLetter(format: 'pdf' | 'docx') {
    persist({ coverLetter: letter });
    if (format === 'docx') exportLetterDocx(person, letter, fileBase(t('letter_file')));
    else printDoc('letter', fileBase(t('letter_file')));
  }

  // PDF: tarayıcının "PDF olarak kaydet" yazdırması; sadece .printArea görünür (ny.module.css @media print)
  function printDoc(kind: 'cv' | 'letter', title: string) {
    setPrinting(kind);
    const old = document.title;
    setTimeout(() => {
      document.title = title;
      window.print();
      document.title = old;
      setPrinting('');
    }, 50);
  }

  function startOver() {
    setStep(1); setRole(''); setAd(''); setResult(null); setLetter(''); setAppId(''); setError('');
    try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* yok */ }
  }

  const score = result?.matchScore;
  const scoreColor = score == null ? 'var(--blue)' : score >= 75 ? '#059669' : score >= 50 ? '#D97706' : '#DC2626';
  const steps = [t('steps.ad'), t('steps.cv'), t('steps.result'), t('steps.letter')];

  return (
    <main className={styles.main}>
      <div className={styles.topbar}>
        <span className={styles.topbarTitle}>{t('title')}</span>
        {step > 1 && <button className={styles.linkBtn} onClick={startOver}>↺ {t('start_over')}</button>}
      </div>

      <div className={styles.content}>
        <ol className={styles.stepper}>
          {steps.map((label, i) => (
            <li key={label} className={i + 1 === step ? styles.stepActive : i + 1 < step ? styles.stepDone : ''}>
              <span>{i + 1 < step ? '✓' : i + 1}</span>{label}
            </li>
          ))}
        </ol>

        {error && <div className={styles.error}>{error}</div>}

        {/* ── 1. İLAN ── */}
        {step === 1 && (
          <section className={styles.card}>
            <h2>{t('step1.title')}</h2>
            <p className={styles.lead}>{t('step1.lead')}</p>
            <AdLinkInput pastedUrl={pastedUrl} generic onFetched={a => { setRole([a.title, a.company].filter(Boolean).join(' — ')); setAd(a.text); }} />
            <label className={styles.label}>{t('step1.role')}</label>
            <input className={styles.input} value={role} onChange={e => setRole(e.target.value)} placeholder={t('step1.role_ph')} />
            <label className={styles.label}>{t('step1.ad')}</label>
            <textarea
              className={styles.textarea}
              rows={10}
              maxLength={8000}
              value={ad}
              placeholder={t('step1.ad_ph')}
              onChange={e => setAd(e.target.value)}
              onPaste={e => {
                const text = e.clipboardData.getData('text');
                if (!ad.trim() && isLoneUrl(text)) { e.preventDefault(); setPastedUrl(text.trim()); }
              }}
            />
            <div className={styles.actions}>
              <button className={styles.primary} disabled={ad.trim().length < 80} onClick={() => setStep(2)}>{t('next')} →</button>
              <button className={styles.linkBtn} onClick={() => onNavigate('applications')}>🔍 {t('step1.search')}</button>
            </div>
          </section>
        )}

        {/* ── 2. CV ── */}
        {step === 2 && (
          <section className={styles.card}>
            <h2>{t('step2.title')}</h2>
            {!profile && <p className={styles.lead}>…</p>}
            {profile && hasCvContent(profile) && (
              <>
                <p className={styles.lead}>{t('step2.have_cv')}</p>
                <div className={styles.cvSummaryBox}>
                  <div className={styles.cvName}>{person.name}</div>
                  <div className={styles.cvMeta}>{[profile.title, t('step2.counts', { exp: profile.experiences.length, edu: profile.educations.length, skills: profile.skills.length })].filter(Boolean).join(' · ')}</div>
                </div>
                {limitHit ? <LimitBox t={t} onUpgrade={() => onNavigate('upgrade')} /> : (
                  <div className={styles.actions}>
                    <button className={styles.primary} onClick={() => tailor(profile)}>{t('step2.use_cv')} →</button>
                    <CvImport compact onImported={onImport} />
                    <button className={styles.linkBtn} onClick={() => onNavigate('profile')}>✏️ {t('step2.edit_cv')}</button>
                  </div>
                )}
              </>
            )}
            {profile && !hasCvContent(profile) && (
              <>
                <p className={styles.lead}>{t('step2.no_cv')}</p>
                <CvImport onImported={onImport} />
                <button className={styles.linkBtn} onClick={() => onNavigate('profile')}>✏️ {t('step2.manual')}</button>
              </>
            )}
            <div className={styles.back}><button className={styles.linkBtn} onClick={() => setStep(1)}>← {t('back')}</button></div>
          </section>
        )}

        {/* ── 3. SONUÇ + UYARLANMIŞ CV ── */}
        {step === 3 && busy === 'tailor' && (
          <section className={styles.card}><div className={styles.loading}><span className={styles.spinner} />{t('step3.working')}</div></section>
        )}
        {step === 3 && result && busy !== 'tailor' && (
          <>
            <section className={styles.card}>
              <div className={styles.resultHead}>
                {score != null && (
                  <div className={styles.scoreRing} style={{ ['--score' as string]: score, ['--score-color' as string]: scoreColor }}>
                    <span>{score}%</span><small>{t('step3.match')}</small>
                  </div>
                )}
                <div>
                  <div className={styles.roleLabel}>{t('step3.role')}</div>
                  <div className={styles.roleName}>{role || result.role}</div>
                </div>
              </div>
              <div className={styles.chips}>
                {result.requirements.map(r => <span key={r.text} className={`${styles.chip} ${r.met ? styles.chipOk : styles.chipMiss}`}>{r.met ? '✓' : '!'} {r.text}</span>)}
              </div>
              {result.tips.length > 0 && <ul className={styles.tips}>{result.tips.map(tip => <li key={tip}>{tip}</li>)}</ul>}
            </section>

            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h2>{t('step3.cv_title')}</h2>
                <ExportButtons t={t} onExport={exportCv} />
              </div>
              <p className={styles.notice}>⚠️ {t('step3.check')}</p>

              <label className={styles.label}>{t('cv.profile')}</label>
              <textarea className={styles.textarea} rows={4} value={result.cv.summary} onChange={e => updateCv({ summary: e.target.value })} />

              <label className={styles.label}>{t('cv.experience')}</label>
              {result.cv.experiences.map((e, i) => (
                <div key={e.id ?? i} className={styles.expBox}>
                  <div className={styles.expHead}><strong>{e.role}</strong>{e.company && <> — {e.company}</>}<span>{period(e.start, e.end, t('cv.present'))}</span></div>
                  <textarea
                    className={styles.textarea}
                    rows={Math.max(3, descLines(e.desc).length + 1)}
                    value={e.desc}
                    onChange={ev => updateCv({ experiences: result.cv.experiences.map((x, k) => (k === i ? { ...x, desc: ev.target.value } : x)) })}
                  />
                </div>
              ))}

              <label className={styles.label}>{t('cv.skills')}</label>
              <input className={styles.input} value={result.cv.skills.join(', ')} onChange={e => updateCv({ skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
              <p className={styles.hint}>{t('step3.skills_hint')}</p>

              <div className={styles.actions}>
                <button className={styles.primary} onClick={makeLetter}>{t('step3.to_letter')} →</button>
                <button className={styles.linkBtn} onClick={() => onNavigate('ansokningar')}>{t('done')}</button>
              </div>
            </section>
          </>
        )}

        {/* ── 4. PERSONLIGT BREV ── */}
        {step === 4 && (
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2>{t('step4.title')}</h2>
              {letter && busy !== 'letter' && <ExportButtons t={t} onExport={exportLetter} />}
            </div>
            {busy === 'letter' && <div className={styles.loading}><span className={styles.spinner} />{t('step4.working')}</div>}
            {letter && busy !== 'letter' && (
              <>
                <p className={styles.notice}>⚠️ {t('step3.check')}</p>
                <textarea className={styles.textarea} rows={18} value={letter} onChange={e => setLetter(e.target.value)} />
              </>
            )}
            <div className={styles.actions}>
              <button className={styles.linkBtn} onClick={() => setStep(3)}>← {t('step4.back_cv')}</button>
              <button className={styles.linkBtn} onClick={() => onNavigate('ansokningar')}>{t('done')}</button>
            </div>
          </section>
        )}
      </div>

      {printing && result && (
        <PrintDocument kind={printing} person={{ ...person, title: result.cv.title || person.title }} cv={result.cv} letter={letter} />
      )}
    </main>
  );
}

function ExportButtons({ t, onExport }: { t: ReturnType<typeof useTranslations>; onExport: (f: 'pdf' | 'docx') => void }) {
  return (
    <div className={styles.exportBtns}>
      <span>{t('download')}:</span>
      <button onClick={() => onExport('pdf')}>PDF</button>
      <button onClick={() => onExport('docx')}>Word</button>
    </div>
  );
}

function LimitBox({ t, onUpgrade }: { t: ReturnType<typeof useTranslations>; onUpgrade: () => void }) {
  return (
    <div className={styles.limit}>
      <strong>{t('limit.title')}</strong>
      <p>{t('limit.text')}</p>
      <button className={styles.primary} onClick={onUpgrade}>{t('limit.cta')}</button>
    </div>
  );
}
