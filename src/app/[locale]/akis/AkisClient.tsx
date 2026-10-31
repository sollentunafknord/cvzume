'use client';

// Rehberli başvuru akışı (PLAN.md): her ekranda tek soru.
// İlk kez: "Hazır CV var mı?" → yükle/oku veya soru-cevapla oluştur → kontrol paneli → standart görünüm.
// Sonra (CV kayıtlıysa doğrudan): ilan → karşılaştırma (eksikleri sor) → uyarlanmış CV → mektup → bitti.
// Taslak localStorage'da tutulur; kullanıcı kaldığı yerden devam eder.
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Lexend } from 'next/font/google';
import { useLocale, useTranslations } from 'next-intl';
import styles from './akis.module.css';
import LogoMark from '@/components/LogoMark';
import AdLinkInput, { type FetchedAd } from '../AdLinkInput';
import JobSearchButton from '../JobSearchButton';
import { RETURN_KEY } from '@/lib/market';
import PrintDocument from '../(app)/ny/PrintDocument';
import { authFetch } from '@/lib/auth-client';
import { EMPTY_PROFILE, hasCvContent, loadCvPhoto, loadProfile, saveAvatarUrl, saveProfile, uploadPhoto, type Profile } from '@/lib/profile-store';
import { cvText, descLines, docLang, exportCvDocx, exportLetterDocx, freeFooter, letterMeta, period, printPortal, safeFileName, type ExportPerson } from '@/lib/export-docs';

type Screen = 'welcome' | 'hasCv' | 'upload' | 'reading' | 'name' | 'contact' | 'photo' | 'target' | 'worked' | 'nowork' | 'job' | 'jobai'
  | 'edu' | 'lang' | 'licence' | 'skills' | 'building' | 'panel' | 'preview' | 'ad' | 'analyzing' | 'match' | 'tailored' | 'tailoredEdit'
  | 'letter' | 'done' | 'limit';
type Job = { role: string; company: string; start: string; end: string; current: boolean; text: string; bullets: string[] };
type Draft = {
  first: string; last: string; phone: string; street: string; zip: string; city: string; target: string;
  jobs: Job[]; job: Job; intern: boolean; school: string; field: string; year: string; studying: boolean;
  langs: string[]; licence: boolean | null; skills: string[]; suggestions: string[];
};
type Req = { text: string; met: boolean };
type Result = { role: string; employer?: string; matchScore: number | null; requirements: Req[]; tips: string[]; cv: Profile; creditToken?: string };
type State = { screen: Screen; history: Screen[]; path: 'yes' | 'no' | ''; draft: Draft; ad: string; role: string; result: Result | null; letter: string; asks: Record<number, 'yes' | 'no' | ''>; notes: Record<number, string>; saved: boolean };

const STORE = 'cvzume_akis_v1';
const lexend = Lexend({ subsets: ['latin', 'latin-ext'], weight: ['300', '400', '500', '600', '700'], variable: '--font-lexend', display: 'swap' });

// Paletler (PLAN.md): ücretsiz planda Nane; Pro üçü arasından seçer. Uygulama + CV/PDF başlık rengi.
type Palette = 'mint' | 'sky' | 'apricot';
const PALETTES: Record<Palette, { swatch: string; ink: string; back: string; strong: string }> = {
  mint: { swatch: '#A7D7C5', ink: '#23343A', back: '#FBE3A6', strong: '#3E7F6C' },
  sky: { swatch: '#B9CEF3', ink: '#24304A', back: '#FFD9C4', strong: '#4B6FB5' },
  apricot: { swatch: '#F6CDB3', ink: '#3A2E33', back: '#DCD0F4', strong: '#B86E4B' },
};
const PALETTE_KEY = 'cvzume_palette';
const NEW_JOB: Job = { role: '', company: '', start: '', end: '', current: false, text: '', bullets: [] };
const NEW_DRAFT: Draft = { first: '', last: '', phone: '', street: '', zip: '', city: '', target: '', jobs: [], job: NEW_JOB, intern: false, school: '', field: '', year: '', studying: false, langs: [], licence: null, skills: [], suggestions: [] };
const ORDER_NO: Screen[] = ['welcome', 'hasCv', 'name', 'contact', 'photo', 'target', 'worked', 'job', 'jobai', 'edu', 'lang', 'licence', 'skills', 'building', 'panel', 'preview', 'ad', 'analyzing', 'match', 'tailored', 'letter', 'done'];
const ORDER_YES: Screen[] = ['welcome', 'hasCv', 'upload', 'reading', 'panel', 'preview', 'ad', 'analyzing', 'match', 'tailored', 'letter', 'done'];
const AUTO: Screen[] = ['reading', 'building', 'analyzing'];

// ── Girdi içeren parçalar modül seviyesinde: bileşen içinde tanımlanırsa her tuşta yeniden
//    oluşur ve imleç alandan düşer. ──
type T = (key: string, values?: Record<string, string | number>) => string;

function Field({ label, value, onChange, ph, type = 'text', id }: { label: string; value: string; onChange: (v: string) => void; ph?: string; type?: string; id: string }) {
  return <label className={styles.f} htmlFor={id}>{label}<input id={id} className={styles.input} type={type} value={value} placeholder={ph} onChange={e => onChange(e.target.value)} /></label>;
}

function AddRow({ onAdd, ph, addLabel }: { onAdd: (v: string) => void; ph: string; addLabel: string }) {
  const [text, setText] = useState('');
  const add = () => { if (text.trim()) { onAdd(text.trim()); setText(''); } };
  return (
    <div className={styles.addRow}>
      <input className={styles.input} value={text} placeholder={ph} aria-label={ph} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add(); }} />
      <button className={`${styles.btn} ${styles.ghost}`} onClick={add}>{addLabel}</button>
    </div>
  );
}

function Chips({ items, onRemove, removeLabel }: { items: string[]; onRemove: (i: number) => void; removeLabel: string }) {
  return <div className={styles.chips}>{items.map((x, i) => <button key={x + i} className={styles.chip} aria-pressed="true" aria-label={`${x} — ${removeLabel}`} onClick={() => onRemove(i)}>{x}<span className={styles.x} aria-hidden>×</span></button>)}</div>;
}

// Kontrol paneli: kayıtlı CV (profile) veya bu ilana uyarlanmış kopya (tailored) üzerinde
function Panel({ cv, set, names, setNames, t, tn }: { cv: Profile; set: (p: Profile) => void; names?: { first: string; last: string }; setNames?: (n: { first: string; last: string }) => void; t: T; tn: T }) {
  const exp = (i: number, patch: Partial<Profile['experiences'][number]>) => set({ ...cv, experiences: cv.experiences.map((e, k) => (k === i ? { ...e, ...patch } : e)) });
  const edu = (i: number, patch: Partial<Profile['educations'][number]>) => set({ ...cv, educations: cv.educations.map((e, k) => (k === i ? { ...e, ...patch } : e)) });
  return (
    <>
      <details className={styles.sec} open>
        <summary>{t('panel.personal')}<span>{t('panel.edit')}</span></summary>
        <div className={styles.secIn}>
          {names && setNames && <div className={styles.row2}>
            <Field id="p-first" label={t('name.first')} value={names.first} onChange={v => setNames({ ...names, first: v })} />
            <Field id="p-last" label={t('name.last')} value={names.last} onChange={v => setNames({ ...names, last: v })} />
          </div>}
          <Field id="p-title" label={t('panel.job_title')} value={cv.title} onChange={v => set({ ...cv, title: v })} />
          <Field id="p-phone" label={t('contact.phone')} value={cv.phone} onChange={v => set({ ...cv, phone: v })} />
          <Field id="p-addr" label={t('contact.address')} value={cv.location} onChange={v => set({ ...cv, location: v })} />
        </div>
      </details>
      <details className={styles.sec} open={!cv.summary}>
        <summary>{tn('cv.profile')}<span>{cv.summary ? t('panel.edit') : t('panel.empty')}</span></summary>
        <div className={styles.secIn}><textarea className={styles.textarea} aria-label={tn('cv.profile')} value={cv.summary} onChange={e => set({ ...cv, summary: e.target.value })} /></div>
      </details>
      <details className={styles.sec}>
        <summary>{tn('cv.experience')}<span>{cv.experiences.length}</span></summary>
        <div className={styles.secIn}>
          {cv.experiences.map((e, i) => (
            <div key={e.id ?? i} className={styles.item}>
              <div className={styles.itemHead}>{e.role || t('panel.new_job')}<button className={styles.rm} onClick={() => set({ ...cv, experiences: cv.experiences.filter((_, k) => k !== i) })}>{t('remove')}</button></div>
              <div className={styles.row2}><Field id={`e-r${i}`} label={t('job.role')} value={e.role} onChange={v => exp(i, { role: v })} /><Field id={`e-c${i}`} label={t('job.company')} value={e.company} onChange={v => exp(i, { company: v })} /></div>
              <div className={styles.row2}><Field id={`e-s${i}`} label={t('job.start')} value={e.start} onChange={v => exp(i, { start: v })} /><Field id={`e-e${i}`} label={t('job.end')} value={e.end} ph={tn('cv.present')} onChange={v => exp(i, { end: v })} /></div>
              <label className={styles.f}>{t('panel.duties')}<textarea className={styles.textarea} value={e.desc} onChange={ev => exp(i, { desc: ev.target.value })} /></label>
            </div>
          ))}
          <button className={`${styles.btn} ${styles.ghost}`} onClick={() => set({ ...cv, experiences: [...cv.experiences, { id: Date.now(), role: '', company: '', start: '', end: '', desc: '' }] })}>+ {t('panel.add_job')}</button>
        </div>
      </details>
      <details className={styles.sec}>
        <summary>{tn('cv.education')}<span>{cv.educations.length}</span></summary>
        <div className={styles.secIn}>
          {cv.educations.map((e, i) => (
            <div key={e.id ?? i} className={styles.item}>
              <div className={styles.itemHead}>{e.school || t('panel.new_edu')}<button className={styles.rm} onClick={() => set({ ...cv, educations: cv.educations.filter((_, k) => k !== i) })}>{t('remove')}</button></div>
              <Field id={`d-s${i}`} label={t('edu.school')} value={e.school} onChange={v => edu(i, { school: v })} />
              <div className={styles.row3}><Field id={`d-f${i}`} label={t('edu.field')} value={[e.degree, e.field].filter(Boolean).join(', ')} onChange={v => edu(i, { degree: '', field: v })} /><Field id={`d-y${i}`} label={t('edu.year')} value={e.years} onChange={v => edu(i, { years: v })} /></div>
            </div>
          ))}
          <button className={`${styles.btn} ${styles.ghost}`} onClick={() => set({ ...cv, educations: [...cv.educations, { id: Date.now(), school: '', degree: '', field: '', years: '' }] })}>+ {t('panel.add_edu')}</button>
        </div>
      </details>
      <details className={styles.sec}>
        <summary>{tn('cv.skills')} · {tn('cv.languages')}<span>{cv.skills.length + cv.languages.length}</span></summary>
        <div className={styles.secIn}>
          <p className={styles.small}>{tn('cv.skills')}</p>
          <Chips items={cv.skills} removeLabel={t('remove')} onRemove={i => set({ ...cv, skills: cv.skills.filter((_, k) => k !== i) })} />
          <AddRow ph={t('skills.custom')} addLabel={t('add')} onAdd={v => set({ ...cv, skills: [...cv.skills, v] })} />
          <p className={styles.small}>{tn('cv.languages')}</p>
          <Chips items={cv.languages} removeLabel={t('remove')} onRemove={i => set({ ...cv, languages: cv.languages.filter((_, k) => k !== i) })} />
          <AddRow ph={t('lang.name_ph')} addLabel={t('add')} onAdd={v => set({ ...cv, languages: [...cv.languages, v] })} />
        </div>
      </details>
    </>
  );
}

function Next({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick: () => void }) {
  return <button className={`${styles.btn} ${styles.primary}`} disabled={disabled} onClick={onClick}>{label}</button>;
}

function Choice({ icon, title, sub, onClick }: { icon: string; title: string; sub?: string; onClick: () => void }) {
  return <button className={styles.choice} onClick={onClick}><span className={styles.ic} aria-hidden>{icon}</span><span><strong>{title}</strong>{sub && <small>{sub}</small>}</span></button>;
}

function Loading({ title, sub }: { title: string; sub?: string }) {
  return <div className={styles.loading}><span className={styles.spin} /><strong>{title}</strong>{sub && <span>{sub}</span>}</div>;
}

// CV kağıdı (ekranda; PDF aynı düzeni PrintDocument ile basar)
function Sheet({ cv, name, email, photo, footer, tn }: { cv: Profile; name: string; email: string; photo: string; footer: string; tn: T }) {
  return (
    <div className={styles.paper}>
      <div className={styles.pHead}>
        <div><div className={styles.pName}>{name}</div>{cv.title && <div className={styles.pTitle}>{cv.title}</div>}
          <div className={styles.pContact}>{[cv.location, cv.phone, email].filter(Boolean).join('  ·  ')}</div></div>
        {photo && <img className={styles.pPhoto} src={photo} alt="" />}
      </div>
      {cv.summary && <><h4>{tn('cv.profile')}</h4><p>{cv.summary}</p></>}
      {cv.experiences.length > 0 && <h4>{tn('cv.experience')}</h4>}
      {cv.experiences.map((e, i) => (
        <div key={i}><p><strong>{e.role}</strong>{e.company && ` — ${e.company}`} <span className={styles.pPeriod}>{period(e.start, e.end, tn('cv.present'))}</span></p>
          <ul>{descLines(e.desc).map(l => <li key={l}>{l}</li>)}</ul></div>
      ))}
      {cv.educations.length > 0 && <h4>{tn('cv.education')}</h4>}
      {cv.educations.map((e, i) => <p key={i}><strong>{[e.degree, e.field].filter(Boolean).join(', ')}</strong>{e.school && ` — ${e.school}`} <span className={styles.pPeriod}>{e.years}</span></p>)}
      {cv.skills.length > 0 && <><h4>{tn('cv.skills')}</h4><p>{cv.skills.join('  ·  ')}</p></>}
      {cv.languages.length > 0 && <><h4>{tn('cv.languages')}</h4><p>{cv.languages.join('  ·  ')}</p></>}
      {footer && <div className={styles.pFooter}>{footer}</div>}
    </div>
  );
}

export default function AkisClient() {
  const t = useTranslations('akis');
  const tn = useTranslations('ny');
  const ti = useTranslations('cvimport');
  const locale = useLocale();
  const [s, setS] = useState<State | null>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [names, setNames] = useState({ first: '', last: '' });
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState('');
  const [isPro, setIsPro] = useState(false);
  // İlk çizim yükleme ekranı (paletsiz), bu yüzden sunucu/istemci farkı hidrasyon sorunu yaratmaz
  const [chosen, setChosen] = useState<Palette>(() => {
    try { const v = typeof window !== 'undefined' ? localStorage.getItem(PALETTE_KEY) : null; return v && v in PALETTES ? (v as Palette) : 'mint'; } catch { return 'mint'; }
  });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [printing, setPrinting] = useState<'' | 'cv' | 'letter'>('');
  const [langName, setLangName] = useState('');
  const [langLevel, setLangLevel] = useState('fluent');
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  // ── Başlangıç: giriş kontrolü, kayıtlı taslak veya kayıtlı CV ──
  useEffect(() => {
    const token = localStorage.getItem('cvita_token');
    if (!token) { window.location.assign(`/${locale}/auth`); return; }
    const user = JSON.parse(localStorage.getItem('cvita_user') || '{}');
    let saved: State | null = null;
    try { saved = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch { /* bozuk */ }
    Promise.all([loadProfile(locale), loadCvPhoto()]).then(([p, ph]) => {
      setProfile(p);
      setPhoto(ph);
      setNames({ first: user.firstName || '', last: user.lastName || '' });
      setEmail(user.email || '');
      // İş aramadan "Analiz et" ile gelindiyse ilan doldurulmuş olarak ilan ekranında başla
      let prefill: { role?: string; description?: string } | null = null;
      try { prefill = JSON.parse(localStorage.getItem('cvita_prefill_job') || 'null'); localStorage.removeItem('cvita_prefill_job'); localStorage.removeItem(RETURN_KEY); } catch { /* yok */ }
      if (prefill?.description && saved) setS({ ...saved, screen: 'ad', ad: prefill.description, role: prefill.role || '', result: null, letter: '', saved: false, asks: {}, notes: {} });
      else if (prefill?.description) setS({ screen: hasCvContent(p) ? 'ad' : 'welcome', history: [], path: '', draft: { ...NEW_DRAFT, first: user.firstName || '', last: user.lastName || '' }, ad: prefill.description, role: prefill.role || '', result: null, letter: '', asks: {}, notes: {}, saved: false });
      else if (saved?.screen && !AUTO.includes(saved.screen)) setS(saved);
      else setS({ screen: hasCvContent(p) ? 'ad' : 'welcome', history: [], path: '', draft: { ...NEW_DRAFT, first: user.firstName || '', last: user.lastName || '' }, ad: '', role: '', result: null, letter: '', asks: {}, notes: {}, saved: false });
    });
    authFetch('/api/stripe/subscription').then(r => r.json()).then(d => setIsPro(d.plan === 'pro')).catch(() => {});
  }, [locale]);

  useEffect(() => { if (s) try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* özel mod */ } }, [s]);

  const up = useCallback((patch: Partial<State>) => setS(prev => (prev ? { ...prev, ...patch } : prev)), []);
  const draft = (patch: Partial<Draft>) => setS(prev => (prev ? { ...prev, draft: { ...prev.draft, ...patch } } : prev));
  const job = (patch: Partial<Job>) => setS(prev => (prev ? { ...prev, draft: { ...prev.draft, job: { ...prev.draft.job, ...patch } } } : prev));
  const go = (screen: Screen, extra: Partial<State> = {}) => { setError(''); setS(prev => (prev ? { ...prev, ...extra, history: [...prev.history, prev.screen].slice(-40), screen } : prev)); window.scrollTo(0, 0); };
  const back = () => setS(prev => {
    if (!prev?.history.length) return prev;
    const h = [...prev.history]; let to = h.pop()!;
    while (AUTO.includes(to) && h.length) to = h.pop()!;
    return { ...prev, history: h, screen: to };
  });

  const fullName = [names.first, names.last].filter(Boolean).join(' ') || email;
  const person = (cv: Profile): ExportPerson => ({ name: fullName, email, phone: cv.phone, location: cv.location, title: cv.title, photo });
  // Ücretsiz planda belgenin altındaki ibare, belgenin kendi dilinde (Türkçe CV → Türkçe ibare)
  const footerFor = (text: string) => (isPro ? '' : freeFooter(docLang(text, locale)));
  const meta = () => letterMeta(docLang(s?.letter || '', locale), s?.result?.role || s?.role || '', profile.location, s?.result?.employer);
  const palette: Palette = isPro ? chosen : 'mint';
  const pal = PALETTES[palette];
  const pickPalette = (v: Palette) => { setChosen(v); try { localStorage.setItem(PALETTE_KEY, v); } catch { /* yok */ } };
  const docColors = { accent: pal.strong.slice(1), ink: pal.ink.slice(1) };
  const cvLabels = { profile: tn('cv.profile'), experience: tn('cv.experience'), education: tn('cv.education'), skills: tn('cv.skills'), languages: tn('cv.languages'), present: tn('cv.present') };

  // ── Yapay zeka çağrıları ──
  async function assist<T>(body: Record<string, unknown>): Promise<T | null> {
    const res = await authFetch('/api/ai/cv-assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, locale }) }).catch(() => null);
    return res?.ok ? res.json() : null;
  }

  async function makeBullets() {
    if (!s) return;
    const j = s.draft.job;
    go('jobai');
    if (j.bullets.length || !j.text.trim()) return;
    setBusy('bullets');
    const d = await assist<{ bullets: string[] }>({ mode: 'bullets', text: j.text, role: j.role, company: j.company });
    job({ bullets: d?.bullets?.length ? d.bullets : j.text.split(/[.\n]+/).map(x => x.trim()).filter(Boolean) });
    setBusy('');
  }

  function saveJob(next: Screen) {
    if (!s) return;
    const j = s.draft.job;
    const jobs = j.role || j.company ? [...s.draft.jobs, j] : s.draft.jobs;
    setS(prev => (prev ? { ...prev, draft: { ...prev.draft, jobs, job: NEW_JOB }, history: [...prev.history, prev.screen], screen: next } : prev));
  }

  async function loadSkills() {
    if (!s) return;
    go('skills');
    if (s.draft.suggestions.length || !s.draft.target) return;
    setBusy('skills');
    const context = s.draft.jobs.map(j => `${j.role}: ${j.bullets.join('; ')}`).join('\n');
    const d = await assist<{ skills: string[] }>({ mode: 'skills', target: s.draft.target, context });
    draft({ suggestions: d?.skills || [] });
    setBusy('');
  }

  function profileFromDraft(d: Draft, summary: string): Profile {
    const addr = [d.street, [d.zip, d.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    return {
      phone: d.phone, location: addr, title: d.target, summary,
      experiences: d.jobs.map((j, i) => ({ id: i + 1, role: j.role, company: j.company, start: j.start, end: j.current ? '' : j.end, desc: (j.bullets.length ? j.bullets : [j.text]).join('\n') })),
      educations: d.school ? [{ id: 1, school: d.school, degree: '', field: d.field, years: d.studying ? `${d.year || ''} – ${t('edu.ongoing')}`.trim() : d.year }] : [],
      skills: [...d.skills, ...(d.licence ? [t('licence.skill')] : [])],
      languages: d.langs,
    };
  }

  async function buildCv() {
    if (!s) return;
    go('building');
    const d = s.draft;
    const base = profileFromDraft(d, '');
    const facts = [
      `Looking for: ${d.target}`,
      ...base.experiences.map(e => `Job: ${e.role}, ${e.company} (${e.start}–${e.end || 'present'}): ${e.desc.replace(/\n/g, '; ')}`),
      ...base.educations.map(e => `Education: ${e.field}, ${e.school} ${e.years}`),
      `Skills: ${base.skills.join(', ')}`, `Languages: ${base.languages.join(', ')}`,
    ].join('\n');
    const sum = await assist<{ summary: string }>({ mode: 'summary', facts });
    const p = { ...base, summary: sum?.summary || '' };
    setProfile(p);
    setNames({ first: d.first, last: d.last });
    await saveProfile(locale, p, { firstName: d.first, lastName: d.last });
    setS(prev => (prev ? { ...prev, screen: 'panel' } : prev));
  }

  async function importFile(file: File) {
    go('reading');
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await authFetch('/api/cv/import', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'unreadable');
      const { firstName, lastName, ...p } = data.profile as Profile & { firstName?: string; lastName?: string };
      const prof = { ...EMPTY_PROFILE, ...p };
      setProfile(prof);
      if (firstName || lastName) setNames({ first: firstName || names.first, last: lastName || names.last });
      await saveProfile(locale, prof, { firstName, lastName });
      setS(prev => (prev ? { ...prev, screen: 'panel' } : prev));
    } catch (e) {
      const code = e instanceof Error ? e.message : 'unreadable';
      setS(prev => (prev ? { ...prev, screen: 'upload', history: prev.history.slice(0, -1) } : prev));
      setError(ti.has(`errors.${code}`) ? ti(`errors.${code}`) : ti('errors.unreadable'));
    }
  }

  async function addPhoto(file: File) {
    if (file.size > 2 * 1024 * 1024) { setError(t('photo.too_large')); return; }
    setBusy('photo');
    try {
      const url = await uploadPhoto(file);
      await saveAvatarUrl(url, locale);
      setPhoto(await loadCvPhoto());
      go('target');
    } catch { setError(t('photo.failed')); }
    setBusy('');
  }

  async function tailor(extraSkills: string[] = []) {
    if (!s) return;
    const cv = { ...profile, skills: [...profile.skills, ...extraSkills.filter(x => !profile.skills.includes(x))] };
    go('analyzing');
    try {
      const res = await authFetch('/api/ai/tailor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobAd: s.ad, cv, locale, creditToken: s.result?.creditToken }) });
      if (res.status === 402) { setS(prev => (prev ? { ...prev, screen: 'limit' } : prev)); return; }
      const data = await res.json();
      if (!res.ok) throw new Error();
      const result: Result = { role: data.role || s.role, employer: data.employer || '', matchScore: data.matchScore, requirements: data.requirements || [], tips: data.tips || [], cv: { ...cv, ...data.cv }, creditToken: data.creditToken };
      setS(prev => (prev ? { ...prev, screen: 'match', result, role: prev.role || data.role || '', asks: {}, notes: {}, saved: false, letter: '' } : prev));
    } catch {
      setS(prev => (prev ? { ...prev, screen: 'ad', history: prev.history.slice(0, -1) } : prev));
      setError(t('errors.ai'));
    }
  }

  // Eksik şart için kullanıcının yazdığı gerçek bilgi → kayıtlı CV'ye de eklenir, sonra yeniden karşılaştırılır
  async function recheck() {
    if (!s?.result) return;
    const extra = Object.entries(s.asks).filter(([, v]) => v === 'yes').map(([k]) => (s.notes[Number(k)] || '').trim()).filter(Boolean);
    if (!extra.length) return;
    const p = { ...profile, skills: [...profile.skills, ...extra.filter(x => !profile.skills.includes(x))] };
    setProfile(p);
    saveProfile(locale, p);
    await tailor(extra);
  }

  async function writeLetter() {
    if (!s?.result) return;
    go('letter');
    if (s.letter) return;
    setBusy('letter');
    try {
      const res = await authFetch('/api/ai/letter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobAd: s.ad, cv: s.result.cv, name: fullName, locale }) });
      const data = await res.json();
      if (!res.ok || !data.letter) throw new Error();
      up({ letter: data.letter });
    } catch { setError(t('errors.ai')); }
    setBusy('');
  }

  async function finish() {
    if (!s?.result) return;
    go('done');
    if (s.saved) return;
    const token = localStorage.getItem('cvita_token');
    await fetch('/api/applications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: token, role: s.result.role || s.role, jobAd: s.ad, matchScore: s.result.matchScore, cvSummary: s.result.cv.summary, coverLetter: s.letter || null, keyRequirements: s.result.requirements.map(r => r.text), tips: s.result.tips, status: 'draft', tailoredCv: s.result.cv }),
    }).catch(() => {});
    up({ saved: true });
  }

  function exportCv(cv: Profile, format: 'pdf' | 'docx') {
    const name = safeFileName(fullName, 'CV', s?.result?.role || cv.title || '');
    if (format === 'docx') exportCvDocx(person(cv), cv, cvLabels, name, { footer: footerFor(cvText(cv)), ...docColors });
    else { setPrinting('cv'); printPortal(name).finally(() => setPrinting('')); }
  }
  function exportLetter(format: 'pdf' | 'docx') {
    if (!s) return;
    const name = safeFileName(fullName, tn('letter_file'), s.result?.role || '');
    if (format === 'docx') exportLetterDocx(person(profile), s.letter, name, { footer: footerFor(s.letter), meta: meta(), ...docColors });
    else { setPrinting('letter'); printPortal(name).finally(() => setPrinting('')); }
  }

  if (!s) return <div className={`${styles.page} ${lexend.variable}`}><div className={styles.loading}><span className={styles.spin} /></div></div>;
  const d = s.draft;
  const order = s.path === 'yes' ? ORDER_YES : ORDER_NO;
  const idx = Math.max(0, order.indexOf(s.screen === 'nowork' ? 'job' : s.screen === 'tailoredEdit' ? 'tailored' : s.screen));
  const printCv = s.screen === 'preview' || s.screen === 'panel' ? profile : s.result?.cv ?? profile;

  // ── Küçük yapı taşları ──



  const band = (n: number | null) => (n == null ? 'y' : n >= 70 ? 'g' : n >= 40 ? 'y' : 'r');
  const ring = (pct: number, color: string) => (
    <svg className={styles.ring} viewBox="0 0 84 84" aria-hidden><circle cx="42" cy="42" r="35" fill="none" stroke="#E3E8E4" strokeWidth="9" />
      <circle cx="42" cy="42" r="35" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 219.9} 219.9`} transform="rotate(-90 42 42)" />
      <text x="42" y="49" textAnchor="middle" fontSize="19" fontWeight="700" fill="currentColor">{pct}%</text></svg>
  );

  let body: React.ReactNode = null;
  let foot: React.ReactNode = null;

  switch (s.screen) {
    case 'welcome':
      body = <>
        <p className={styles.hint}>{t('welcome.hi', { name: names.first || '' })}</p>
        <h1 className={styles.q}>{t('welcome.title')}</h1>
        <p className={styles.hint}>{t('welcome.text')}</p>
        <div className={styles.list}><div>1. {t('welcome.s1')}<span>{t('welcome.min', { n: 5 })}</span></div><div>2. {t('welcome.s2')}<span>{t('welcome.min', { n: 1 })}</span></div><div>3. {t('welcome.s3')}<span>{t('welcome.min', { n: 2 })}</span></div></div>
      </>;
      foot = <Next onClick={() => go('hasCv')} label={t('welcome.start')} />;
      break;
    case 'hasCv':
      body = <>
        <h1 className={styles.q}>{t('hasCv.title')}</h1><p className={styles.hint}>{t('hasCv.text')}</p>
        <Choice icon="📄" title={t('hasCv.yes')} sub={t('hasCv.yes_sub')} onClick={() => go('upload', { path: 'yes' })} />
        <Choice icon="✍️" title={t('hasCv.no')} sub={t('hasCv.no_sub')} onClick={() => go('name', { path: 'no' })} />
      </>;
      break;
    case 'upload':
      body = <>
        <h1 className={styles.q}>{t('upload.title')}</h1><p className={styles.hint}>{t('upload.text')}</p>
        <button className={styles.drop} onClick={() => fileRef.current?.click()}><strong>{t('upload.pick')}</strong>{t('upload.formats')}</button>
        <input ref={fileRef} type="file" hidden accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ''; }} />
        {error && <p className={styles.err}>{error}</p>}
      </>;
      foot = <button className={`${styles.btn} ${styles.link}`} onClick={() => go('name', { path: 'no' })}>{t('upload.no_file')}</button>;
      break;
    case 'reading': body = <Loading title={t('upload.reading')} sub={t('upload.reading_sub')} />; break;
    case 'name':
      body = <><h1 className={styles.q}>{t('name.title')}</h1>
        <Field id="q-first" label={t('name.first')} value={d.first} onChange={v => draft({ first: v })} />
        <Field id="q-last" label={t('name.last')} value={d.last} onChange={v => draft({ last: v })} /></>;
      foot = <Next onClick={() => go('contact')} label={t('next')} disabled={!d.first.trim()} />;
      break;
    case 'contact':
      body = <><h1 className={styles.q}>{t('contact.title')}</h1>
        <Field id="q-phone" type="tel" label={t('contact.phone')} value={d.phone} onChange={v => draft({ phone: v })} />
        <label className={styles.f}>{t('contact.email')}<input className={styles.input} value={email} readOnly /></label>
        <Field id="q-street" label={t('contact.street')} value={d.street} onChange={v => draft({ street: v })} />
        <div className={styles.row2}><Field id="q-zip" label={t('contact.zip')} value={d.zip} onChange={v => draft({ zip: v })} /><Field id="q-city" label={t('contact.city')} value={d.city} onChange={v => draft({ city: v })} /></div></>;
      foot = <Next onClick={() => go('photo')} label={t('next')} disabled={!d.phone.trim()} />;
      break;
    case 'photo':
      body = <><h1 className={styles.q}>{t('photo.title')}</h1><p className={styles.hint}>{t('photo.text')}</p>
        {photo && <img src={photo} alt="" style={{ width: 96, height: 96, borderRadius: 10, objectFit: 'cover' }} />}
        <Choice icon="🖼️" title={busy === 'photo' ? '…' : photo ? t('photo.change') : t('photo.upload')} sub={t('photo.formats')} onClick={() => photoRef.current?.click()} />
        <Choice icon="→" title={photo ? t('photo.keep') : t('photo.skip')} sub={photo ? undefined : t('photo.skip_sub')} onClick={() => go('target')} />
        <input ref={photoRef} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={e => { const f = e.target.files?.[0]; if (f) addPhoto(f); e.target.value = ''; }} />
        {error && <p className={styles.err}>{error}</p>}</>;
      break;
    case 'target':
      body = <><h1 className={styles.q}>{t('target.title')}</h1><p className={styles.hint}>{t('target.text')}</p>
        <Field id="q-target" label={t('target.label')} ph={t('target.ph')} value={d.target} onChange={v => draft({ target: v, suggestions: [] })} /></>;
      foot = <Next onClick={() => go('worked')} label={t('next')} disabled={!d.target.trim()} />;
      break;
    case 'worked':
      body = <><h1 className={styles.q}>{d.jobs.length ? t('worked.more') : t('worked.title')}</h1><p className={styles.hint}>{t('worked.text')}</p>
        <Choice icon="💼" title={t('yes')} sub={d.jobs.length ? undefined : t('worked.yes_sub')} onClick={() => go('job', { draft: { ...d, intern: false } })} />
        <Choice icon="🌱" title={d.jobs.length ? t('worked.done') : t('worked.no')} sub={d.jobs.length ? undefined : t('worked.no_sub')} onClick={() => go(d.jobs.length ? 'edu' : 'nowork')} /></>;
      break;
    case 'nowork':
      body = <><h1 className={styles.q}>{t('nowork.title')}</h1><p className={styles.hint}>{t('nowork.text')}</p>
        <Choice icon="🤝" title={t('yes')} onClick={() => go('job', { draft: { ...d, intern: true } })} />
        <Choice icon="→" title={t('nowork.no')} onClick={() => go('edu')} /></>;
      break;
    case 'job':
      body = <><h1 className={styles.q}>{d.intern ? t('job.title_intern') : d.jobs.length ? t('job.title_prev') : t('job.title')}</h1>
        <div className={styles.row2}><Field id="j-role" label={t('job.role')} value={d.job.role} onChange={v => job({ role: v, bullets: [] })} /><Field id="j-co" label={t('job.company')} value={d.job.company} onChange={v => job({ company: v })} /></div>
        <div className={styles.row2}><Field id="j-start" label={t('job.start')} ph={t('job.date_ph')} value={d.job.start} onChange={v => job({ start: v })} />
          {!d.job.current && <Field id="j-end" label={t('job.end')} ph={t('job.date_ph')} value={d.job.end} onChange={v => job({ end: v })} />}</div>
        <label className={styles.check}><input type="checkbox" checked={d.job.current} onChange={e => job({ current: e.target.checked })} />{t('job.current')}</label>
        <label className={styles.f} htmlFor="j-text">{t('job.what')}<textarea id="j-text" className={styles.textarea} placeholder={t('job.what_ph')} value={d.job.text} onChange={e => job({ text: e.target.value, bullets: [] })} /></label>
        <p className={styles.small}>🎙️ {t('job.voice')}</p></>;
      foot = <Next label={t('next')} onClick={makeBullets} disabled={!d.job.role.trim() || !d.job.text.trim()} />;
      break;
    case 'jobai':
      body = busy === 'bullets' ? <Loading title={t('jobai.loading')} /> : <><h1 className={styles.q}>{t('jobai.title')}</h1><p className={styles.hint}>{t('jobai.text')}</p>
        <div className={styles.ai}><div className={styles.lbl}>{t('jobai.label')}</div>
          <textarea className={styles.textarea} aria-label={t('jobai.label')} value={d.job.bullets.join('\n')} onChange={e => job({ bullets: e.target.value.split('\n') })} /></div>
        <p className={styles.small}>{t('jobai.edit_hint')}</p></>;
      foot = busy === 'bullets' ? null : <><button className={`${styles.btn} ${styles.ghost}`} onClick={() => saveJob('job')}>{t('jobai.another')}</button><Next label={t('jobai.ok')} onClick={() => saveJob('edu')} /></>;
      break;
    case 'edu':
      body = <><h1 className={styles.q}>{t('edu.title')}</h1>
        <Field id="u-school" label={t('edu.school')} value={d.school} onChange={v => draft({ school: v })} />
        <Field id="u-field" label={t('edu.field')} value={d.field} onChange={v => draft({ field: v })} />
        <div className={styles.row2}><Field id="u-year" label={t('edu.year')} value={d.year} onChange={v => draft({ year: v })} /><span /></div>
        <label className={styles.check}><input type="checkbox" checked={d.studying} onChange={e => draft({ studying: e.target.checked })} />{t('edu.studying')}</label></>;
      foot = <><Next onClick={() => go('lang')} label={t('next')} disabled={!d.school.trim()} /><button className={`${styles.btn} ${styles.link}`} onClick={() => go('lang', { draft: { ...d, school: '' } })}>{t('skip')}</button></>;
      break;
    case 'lang': {
      const levels = ['native', 'fluent', 'good', 'basic'];
      body = <><h1 className={styles.q}>{t('lang.title')}</h1><p className={styles.hint}>{t('lang.text')}</p>
        {d.langs.length > 0 && <Chips items={d.langs} removeLabel={t('remove')} onRemove={i => draft({ langs: d.langs.filter((_, k) => k !== i) })} />}
        <div className={styles.row3}><Field id="l-name" label={t('lang.name')} ph={t('lang.name_ph')} value={langName} onChange={setLangName} />
          <label className={styles.f}>{t('lang.level')}<select className={styles.select} value={langLevel} onChange={e => setLangLevel(e.target.value)}>{levels.map(l => <option key={l} value={l}>{t(`lang.levels.${l}`)}</option>)}</select></label></div>
        <button className={`${styles.btn} ${styles.ghost}`} disabled={!langName.trim()} onClick={() => { draft({ langs: [...d.langs, `${langName.trim()} (${t(`lang.levels.${langLevel}`)})`] }); setLangName(''); }}>+ {t('lang.add')}</button></>;
      foot = <Next onClick={() => go('licence')} label={t('next')} disabled={!d.langs.length} />;
      break;
    }
    case 'licence':
      body = <><h1 className={styles.q}>{t('licence.title')}</h1>
        <Choice icon="🚗" title={t('licence.yes')} onClick={() => { draft({ licence: true }); loadSkills(); }} />
        <Choice icon="—" title={t('licence.no')} onClick={() => { draft({ licence: false }); loadSkills(); }} /></>;
      break;
    case 'skills':
      body = <><h1 className={styles.q}>{t('skills.title')}</h1><p className={styles.hint}>{t('skills.text', { target: d.target })}</p>
        {busy === 'skills' ? <Loading title={t('skills.loading')} /> : <div className={styles.chips}>
          {[...new Set([...d.suggestions, ...d.skills])].map(x => <button key={x} className={styles.chip} aria-pressed={d.skills.includes(x)} onClick={() => draft({ skills: d.skills.includes(x) ? d.skills.filter(y => y !== x) : [...d.skills, x] })}>{x}</button>)}
        </div>}
        <AddRow ph={t('skills.custom')} addLabel={t('add')} onAdd={v => draft({ skills: [...d.skills, v] })} /></>;
      foot = <Next label={t('skills.build')} onClick={buildCv} disabled={busy === 'skills'} />;
      break;
    case 'building': body = <Loading title={t('building.title')} sub={t('building.sub')} />; break;
    case 'panel':
      body = <><h1 className={styles.q}>{t('panel.title')}</h1><p className={styles.hint}>{s.path === 'yes' ? t('panel.text_upload') : t('panel.text_built')}</p>
        <Panel cv={profile} set={setProfile} names={names} setNames={setNames} t={t} tn={tn} /></>;
      foot = <Next label={t('panel.save')} onClick={async () => { await saveProfile(locale, profile, { firstName: names.first, lastName: names.last }); go('preview'); }} />;
      break;
    case 'preview':
      body = <><h1 className={styles.q}>{t('preview.title')}</h1><Sheet cv={profile} name={fullName} email={email} photo={photo} footer={footerFor(cvText(profile))} tn={tn} /></>;
      foot = <><div className={styles.btnRow}><button className={`${styles.btn} ${styles.ghost}`} onClick={() => exportCv(profile, 'pdf')}>{t('pdf')}</button><button className={`${styles.btn} ${styles.ghost}`} onClick={() => exportCv(profile, 'docx')}>{t('word')}</button></div>
        <button className={`${styles.btn} ${styles.ghost}`} onClick={() => go('panel')}>{t('edit')}</button>
        <Next onClick={() => go('ad')} label={t('preview.next')} /></>;
      break;
    case 'ad':
      body = <><h1 className={styles.q}>{t('ad.title')}</h1><p className={styles.hint}>{t('ad.text')}</p>
        <AdLinkInput generic aside={<JobSearchButton from="akis" />} onFetched={(a: FetchedAd) => up({ ad: a.text, role: [a.title, a.company].filter(Boolean).join(' — ') })} />
        <label className={styles.f} htmlFor="ad-text">{t('ad.or_text')}<textarea id="ad-text" className={styles.textarea} style={{ minHeight: 220 }} value={s.ad} onChange={e => up({ ad: e.target.value, result: null })} /></label>
        {error && <p className={styles.err}>{error}</p>}
        {hasCvContent(profile) && <p className={styles.small}>{t('ad.your_cv', { name: fullName })} · <button className={styles.rm} style={{ color: 'var(--blue)' }} onClick={() => go('panel')}>{t('edit')}</button></p>}</>;
      foot = <Next label={t('ad.compare')} onClick={() => tailor()} disabled={s.ad.trim().length < 80} />;
      break;
    case 'analyzing': body = <Loading title={t('analyzing.title')} sub={t('analyzing.sub')} />; break;
    case 'match': {
      const r = s.result!;
      const b = band(r.matchScore);
      const color = { g: '#6FBF98', y: '#E9B866', r: '#E99A86' }[b];
      const added = Object.entries(s.asks).filter(([k, v]) => v === 'yes' && (s.notes[Number(k)] || '').trim()).length;
      body = <>
        <div className={`${styles.score} ${styles[b]}`}>{ring(r.matchScore ?? 0, color)}<div><strong>{t(`match.${b}_title`)}</strong><span className={styles.small}>{t(`match.${b}_text`)}</span></div></div>
        <div><p style={{ fontWeight: 600, margin: '0 0 4px' }}>{t('match.reqs')}</p>
          {r.requirements.map((q, i) => q.met ? (
            <div key={i} className={styles.req}><span className={`${styles.dot} ${styles.dOk}`}>✓</span><span>{q.text}</span></div>
          ) : s.asks[i] === 'no' ? (
            <div key={i} className={styles.req}><span className={`${styles.dot} ${styles.dNo}`}>!</span><span>{q.text}<br /><small className={styles.small}>{t('match.missing')}</small></span></div>
          ) : (
            <div key={i} className={styles.ask}>
              <div style={{ display: 'flex', gap: 10 }}><span className={`${styles.dot} ${s.asks[i] === 'yes' ? styles.dAdd : styles.dNo}`}>{s.asks[i] === 'yes' ? '+' : '!'}</span><span><strong>{q.text}</strong><br />{t('match.ask')}</span></div>
              {s.asks[i] === 'yes' ? (
                <label className={styles.f}>{t('match.how')}<input className={styles.input} value={s.notes[i] || ''} placeholder={t('match.how_ph')} onChange={e => up({ notes: { ...s.notes, [i]: e.target.value } })} /></label>
              ) : (
                <div className={styles.btnRow}><button className={`${styles.btn} ${styles.primary}`} onClick={() => up({ asks: { ...s.asks, [i]: 'yes' } })}>{t('match.yes')}</button><button className={`${styles.btn} ${styles.ghost}`} onClick={() => up({ asks: { ...s.asks, [i]: 'no' } })}>{t('match.no')}</button></div>
              )}
            </div>
          ))}
        </div>
        {r.tips.length > 0 && <div className={styles.ai}><div className={styles.lbl}>{t('match.tips')}</div>{r.tips.map(x => <p key={x} className={styles.small} style={{ color: 'inherit' }}>• {x}</p>)}</div>}
      </>;
      foot = added ? <Next label={t('match.recheck', { n: added })} onClick={recheck} />
        : b === 'r' ? <><Next label={t('match.give_up')} onClick={() => go('ad', { ad: '', result: null })} /><button className={`${styles.btn} ${styles.ghost}`} onClick={() => go('tailored')}>{t('match.apply_anyway')}</button></>
        : <><Next onClick={() => go('tailored')} label={b === 'g' ? t('match.tailor') : t('match.tailor_anyway')} /><button className={`${styles.btn} ${styles.link}`} onClick={() => go('ad', { ad: '', result: null })}>{t('match.cancel')}</button></>;
      break;
    }
    case 'tailored':
      body = <><h1 className={styles.q}>{t('tailored.title')}</h1><p className={styles.hint}>{t('tailored.text')}</p><Sheet cv={s.result!.cv} name={fullName} email={email} photo={photo} footer={footerFor(cvText(s.result!.cv))} tn={tn} /></>;
      foot = <><div className={styles.btnRow}><button className={`${styles.btn} ${styles.ghost}`} onClick={() => exportCv(s.result!.cv, 'pdf')}>{t('pdf')}</button><button className={`${styles.btn} ${styles.ghost}`} onClick={() => exportCv(s.result!.cv, 'docx')}>{t('word')}</button></div>
        <button className={`${styles.btn} ${styles.ghost}`} onClick={() => go('tailoredEdit')}>{t('edit')}</button>
        <Next label={t('tailored.letter')} onClick={writeLetter} /></>;
      break;
    case 'tailoredEdit':
      body = <><h1 className={styles.q}>{t('tailored.edit_title')}</h1><p className={styles.hint}>{t('tailored.edit_text')}</p>
        <Panel cv={s.result!.cv} set={cv => up({ result: { ...s.result!, cv } })} t={t} tn={tn} /></>;
      foot = <Next label={t('panel.save')} onClick={back} />;
      break;
    case 'letter':
      body = busy === 'letter' ? <Loading title={t('letter.loading')} /> : <><h1 className={styles.q}>{t('letter.title')}</h1>
        <textarea className={styles.textarea} style={{ minHeight: 380 }} aria-label={t('letter.title')} value={s.letter} onChange={e => up({ letter: e.target.value })} />
        {error && <p className={styles.err}>{error}</p>}</>;
      foot = busy === 'letter' ? null : <><div className={styles.btnRow}><button className={`${styles.btn} ${styles.ghost}`} disabled={!s.letter} onClick={() => exportLetter('pdf')}>{t('pdf')}</button><button className={`${styles.btn} ${styles.ghost}`} disabled={!s.letter} onClick={() => exportLetter('docx')}>{t('word')}</button></div>
        <Next label={t('letter.finish')} onClick={finish} /><button className={`${styles.btn} ${styles.link}`} onClick={() => { up({ letter: '' }); finish(); }}>{t('letter.skip')}</button></>;
      break;
    case 'done':
      body = <div className={styles.loading}><div style={{ fontSize: 56 }} aria-hidden>🎉</div><h1 className={styles.q}>{t('done.title')}</h1><p className={styles.hint}>{t('done.text')}</p>
        <div className={styles.list} style={{ width: '100%', textAlign: 'left' }}><div>{t('done.cv')}<em>✓</em></div>{s.letter && <div>{t('done.letter')}<em>✓</em></div>}<div>{t('done.saved')}<em>✓</em></div></div></div>;
      foot = <><Next label={t('done.new')} onClick={() => go('ad', { ad: '', role: '', result: null, letter: '', saved: false, asks: {}, notes: {} })} /><a className={`${styles.btn} ${styles.link}`} style={{ textAlign: 'center' }} href={`/${locale}/ansokningar`}>{t('done.mine')}</a></>;
      break;
    case 'limit':
      body = <><h1 className={styles.q}>{t('limit.title')}</h1><p className={styles.hint}>{t('limit.text')}</p></>;
      foot = <><a className={`${styles.btn} ${styles.primary}`} style={{ textAlign: 'center', textDecoration: 'none' }} href={`/${locale}/upgrade`}>{t('limit.upgrade')}</a><button className={`${styles.btn} ${styles.link}`} onClick={() => go('ad')}>{t('back')}</button></>;
      break;
  }

  return (
    <div className={`${styles.page} ${lexend.variable}`} data-palette={palette}>
      <header className={styles.top}>
        <a className={styles.logo} href={`/${locale}/ny`} aria-label="CVzume"><LogoMark size={28} colors={{ ink: pal.ink, back: pal.back, lines: pal.strong }} /><span>CVzume</span></a>
        <div className={styles.progress} aria-hidden><i style={{ width: `${Math.round((idx / (order.length - 1)) * 100)}%` }} /></div>
        <span className={styles.count}>{idx + 1}/{order.length}</span>
        {isPro && <div className={styles.palettes} role="group" aria-label={t('palette')}>{(Object.keys(PALETTES) as Palette[]).map(k => <button key={k} style={{ background: PALETTES[k].swatch }} aria-label={t(`palettes.${k}`)} aria-pressed={palette === k} onClick={() => pickPalette(k)} />)}</div>}
      </header>
      <main className={styles.card}>
        <div className={styles.body}>
          {s.history.length > 0 && !AUTO.includes(s.screen) && s.screen !== 'done' && <button className={styles.backBtn} onClick={back}>← {t('back')}</button>}
          {body}
        </div>
        {foot && <div className={styles.foot}>{foot}</div>}
      </main>
      {printing && <PrintDocument kind={printing} person={person(printCv)} cv={printCv} letter={s.letter} meta={printing === 'letter' ? meta() : undefined} footer={printing === 'letter' ? footerFor(s.letter) : footerFor(cvText(printCv))} style={{ fontFamily: lexend.style.fontFamily, '--accent': pal.strong, '--ink': pal.ink } as React.CSSProperties} />}
    </div>
  );
}
