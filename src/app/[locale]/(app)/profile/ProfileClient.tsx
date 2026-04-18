'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './profile.module.css';

interface Experience {
  id: number;
  company: string;
  role: string;
  start: string;
  end: string;
  desc: string;
}

interface Education {
  id: number;
  school: string;
  degree: string;
  field: string;
  years: string;
}

interface Profile {
  phone: string;
  location: string;
  title: string;
  summary: string;
  experiences: Experience[];
  educations: Education[];
  skills: string[];
  languages: string[];
}

export default function ProfileClient() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [toast, setToast] = useState('');

  // profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);

  // section open state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true, experience: false, education: false, skills: false, langs: false,
  });

  // mini forms
  const [showExpForm, setShowExpForm] = useState(false);
  const [showEduForm, setShowEduForm] = useState(false);
  const [expForm, setExpForm] = useState({ company: '', role: '', start: '', end: '', desc: '' });
  const [eduForm, setEduForm] = useState({ school: '', degree: '', field: '', years: '' });
  const [skillInput, setSkillInput] = useState('');
  const [langInput, setLangInput] = useState('');

  const progress = (() => {
    let s = 0;
    if (firstName) s += 15;
    if (email) s += 10;
    if (phone) s += 10;
    if (title) s += 15;
    if (summary) s += 15;
    if (experiences.length > 0) s += 20;
    if (skills.length >= 3) s += 15;
    return s;
  })();

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const loadUser = useCallback(async () => {
    const saved = localStorage.getItem('cvita_user');
    if (!saved) { router.push(`/${locale}/auth`); return; }
    const user = JSON.parse(saved);
    const fn = user.firstName || user.email?.split('@')[0] || '';
    const ln = user.lastName || '';
    setFirstName(fn); setLastName(ln); setEmail(user.email || '');

    const av = localStorage.getItem('cvita_avatar');
    if (av) setAvatarUrl(av);

    const token = localStorage.getItem('cvita_token');
    const userId = user.id;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (token && userId) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
          headers: { apikey: supabaseKey, Authorization: 'Bearer ' + token },
        });
        if (res.ok) {
          const rows = await res.json();
          if (rows.length > 0) {
            const db = rows[0];
            const merged = {
              phone: db.phone || '', location: db.location || '', title: db.title || '',
              summary: db.summary || '', experiences: db.experiences || [],
              educations: db.educations || [], skills: db.skills || [], languages: db.languages || [],
            };
            localStorage.setItem('cvita_profile', JSON.stringify(merged));
            if (db.avatar_url && !av) setAvatarUrl(db.avatar_url);
          }
        }
      } catch { /* silent */ }
    }

    const stored = localStorage.getItem('cvita_profile');
    if (stored) {
      const p: Profile = JSON.parse(stored);
      setPhone(p.phone || ''); setLocation(p.location || '');
      setTitle(p.title || ''); setSummary(p.summary || '');
      setExperiences((p.experiences || []).map((e, i) => ({ ...e, id: e.id || Date.now() + i })));
      setEducations((p.educations || []).map((e, i) => ({ ...e, id: e.id || Date.now() + i + 1000 })));
      setSkills(p.skills || []);
      setLanguages(p.languages || []);
    }
  }, [locale, router]);

  useEffect(() => { loadUser(); }, [loadUser]);

  function toggleSection(key: string) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function addExp() {
    if (!expForm.company || !expForm.role) { alert('Företag och roll är obligatoriska.'); return; }
    setExperiences(prev => [{ id: Date.now(), ...expForm }, ...prev]);
    setExpForm({ company: '', role: '', start: '', end: '', desc: '' });
    setShowExpForm(false);
  }

  function addEdu() {
    if (!eduForm.school) { alert('Skola är obligatorisk.'); return; }
    setEducations(prev => [{ id: Date.now(), ...eduForm }, ...prev]);
    setEduForm({ school: '', degree: '', field: '', years: '' });
    setShowEduForm(false);
  }

  function addSkill() {
    const v = skillInput.trim();
    if (v) { setSkills(prev => [...prev, v]); setSkillInput(''); }
  }

  function addLang() {
    const v = langInput.trim();
    if (v) { setLanguages(prev => [...prev, v]); setLangInput(''); }
  }

  async function saveAll() {
    const profile = { phone, location, title, summary, experiences, educations, skills, languages };
    localStorage.setItem('cvita_profile', JSON.stringify(profile));
    const user = JSON.parse(localStorage.getItem('cvita_user') || '{}');
    user.firstName = firstName; user.lastName = lastName;
    localStorage.setItem('cvita_user', JSON.stringify(user));

    const token = localStorage.getItem('cvita_token');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (token && user.id) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', apikey: supabaseKey,
            Authorization: 'Bearer ' + token, Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({ id: user.id, phone, location, title, summary, experiences, educations, skills, languages, updated_at: new Date().toISOString() }),
        });
      } catch { /* silent */ }
    }
    showToast('✅ Profilen sparad!');
  }

  async function uploadAvatar(file: File) {
    if (file.size > 2 * 1024 * 1024) { alert('Filen är för stor. Max 2 MB.'); return; }
    setAvatarUploading(true);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const token = localStorage.getItem('cvita_token');
    const user = JSON.parse(localStorage.getItem('cvita_user') || '{}');
    const ext = file.name.split('.').pop();
    const path = `avatar_${Date.now()}.${ext}`;
    try {
      const res = await fetch(`${supabaseUrl}/storage/v1/object/avatars/${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': file.type, 'x-upsert': 'true', apikey: supabaseKey },
        body: file,
      });
      if (!res.ok) throw new Error('Upload misslyckades');
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${path}`;
      localStorage.setItem('cvita_avatar', publicUrl);
      setAvatarUrl(publicUrl);
      if (token && user.id) {
        fetch(`${supabaseUrl}/rest/v1/profiles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: 'Bearer ' + token, Prefer: 'resolution=merge-duplicates' },
          body: JSON.stringify({ id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() }),
        }).catch(() => {});
      }
      showToast('✅ Profilfoto sparat!');
    } catch (err: unknown) {
      showToast('❌ ' + (err instanceof Error ? err.message : 'Fel'));
    } finally {
      setAvatarUploading(false);
    }
  }

  return (
    <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <span className={styles.topbarTitle}>Mitt CV</span>
          </div>
          <div className={styles.topbarRight}>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => router.push(`/${locale}/dashboard`)}>← Dashboard</button>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => router.push(`/${locale}/cv`)}>📥 Ladda ner PDF</button>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveAll}>💾 Spara allt</button>
          </div>
        </div>

        <div className={styles.content}>
          {/* Progress */}
          <div className={styles.progressCard}>
            <div className={styles.progressText}>
              <div className={styles.progressTitle}>CV-profil slutförd</div>
              <div className={styles.progressSub}>Ju mer du fyller i, desto bättre blir AI-matchningen</div>
            </div>
            <div className={styles.progressBarWrap}>
              <div className={styles.progressBar} style={{ width: `${progress}%` }} />
            </div>
            <div className={styles.progressPct}>{progress}%</div>
          </div>

          <div className={styles.profileSections}>

            {/* ── PERSONAL INFO ── */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHead} onClick={() => toggleSection('personal')}>
                <div className={styles.sectionHeadLeft}>
                  <div className={`${styles.sectionIcon} ${styles.siBlue}`}>👤</div>
                  <div>
                    <div className={styles.sectionHeadTitle}>Personlig information</div>
                    <div className={styles.sectionHeadSub}>{firstName} {lastName}</div>
                  </div>
                </div>
                <span className={styles.sectionToggle}>{openSections.personal ? '▼' : '▶'}</span>
              </div>
              {openSections.personal && (
                <div className={styles.sectionBody}>
                  {/* Avatar */}
                  <div className={styles.avatarSection}>
                    <div className={styles.avatarPreview} onClick={() => avatarInputRef.current?.click()}>
                      {avatarUrl
                        ? <img src={avatarUrl} alt="avatar" />
                        : <span className={styles.avatarInitials}>{initials}</span>
                      }
                    </div>
                    <div className={styles.avatarInfo}>
                      <div className={styles.avatarTitle}>Profilfoto</div>
                      <div className={styles.avatarSub}>JPG, PNG · Max 2 MB</div>
                      <div className={styles.avatarBtns}>
                        <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => avatarInputRef.current?.click()}>
                          📷 Ladda upp foto
                        </button>
                        {avatarUploading && <span className={styles.avatarUploading}>Laddar upp...</span>}
                      </div>
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Förnamn</label>
                      <input className={styles.formInput} value={firstName} onChange={e => setFirstName(e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Efternamn</label>
                      <input className={styles.formInput} value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>E-postadress</label>
                      <input className={styles.formInput} type="email" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Telefon</label>
                      <input className={styles.formInput} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+46 70 123 45 67" />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Ort / Stad</label>
                      <input className={styles.formInput} value={location} onChange={e => setLocation(e.target.value)} placeholder="Stockholm" />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Jobbtitel</label>
                      <input className={styles.formInput} value={title} onChange={e => setTitle(e.target.value)} placeholder="t.ex. Frontend-utvecklare" />
                    </div>
                    <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                      <label className={styles.formLabel}>Sammanfattning / Om mig</label>
                      <textarea className={`${styles.formInput} ${styles.formTextarea}`} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Kort beskrivning om dig själv..." />
                      <span className={styles.formHint}>AI:n använder detta för att skräddarsy ditt CV</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── EXPERIENCE ── */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHead} onClick={() => toggleSection('experience')}>
                <div className={styles.sectionHeadLeft}>
                  <div className={`${styles.sectionIcon} ${styles.siGreen}`}>💼</div>
                  <div>
                    <div className={styles.sectionHeadTitle}>Arbetslivserfarenhet</div>
                    <div className={styles.sectionHeadSub}>{experiences.length} poster</div>
                  </div>
                </div>
                <span className={styles.sectionToggle}>{openSections.experience ? '▼' : '▶'}</span>
              </div>
              {openSections.experience && (
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
                          <button className={styles.expRemove} onClick={() => setExperiences(prev => prev.filter(x => x.id !== e.id))}>✕</button>
                        </div>
                        {e.desc && <div className={styles.expDesc}>{e.desc}</div>}
                      </div>
                    ))}
                  </div>
                  {showExpForm && (
                    <div className={styles.miniForm}>
                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Företag *</label>
                          <input className={styles.formInput} placeholder="t.ex. Spotify" value={expForm.company} onChange={e => setExpForm(p => ({ ...p, company: e.target.value }))} />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Roll / Titel *</label>
                          <input className={styles.formInput} placeholder="t.ex. Frontend-utvecklare" value={expForm.role} onChange={e => setExpForm(p => ({ ...p, role: e.target.value }))} />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Startdatum</label>
                          <input className={styles.formInput} placeholder="2022-01" value={expForm.start} onChange={e => setExpForm(p => ({ ...p, start: e.target.value }))} />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Slutdatum</label>
                          <input className={styles.formInput} placeholder="2024-06 (eller nuvarande)" value={expForm.end} onChange={e => setExpForm(p => ({ ...p, end: e.target.value }))} />
                        </div>
                        <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                          <label className={styles.formLabel}>Beskrivning</label>
                          <textarea className={`${styles.formInput} ${styles.formTextarea}`} placeholder="Beskriv dina arbetsuppgifter..." value={expForm.desc} onChange={e => setExpForm(p => ({ ...p, desc: e.target.value }))} />
                        </div>
                      </div>
                      <div className={styles.miniFormActions}>
                        <button className={`${styles.btnSm} ${styles.btnSmCancel}`} onClick={() => setShowExpForm(false)}>Avbryt</button>
                        <button className={`${styles.btnSm} ${styles.btnSmPrimary}`} onClick={addExp}>＋ Lägg till</button>
                      </div>
                    </div>
                  )}
                  {!showExpForm && (
                    <button className={styles.btnAdd} onClick={() => setShowExpForm(true)}>＋ Lägg till erfarenhet</button>
                  )}
                </div>
              )}
            </div>

            {/* ── EDUCATION ── */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHead} onClick={() => toggleSection('education')}>
                <div className={styles.sectionHeadLeft}>
                  <div className={`${styles.sectionIcon} ${styles.siAmber}`}>🎓</div>
                  <div>
                    <div className={styles.sectionHeadTitle}>Utbildning</div>
                    <div className={styles.sectionHeadSub}>{educations.length} poster</div>
                  </div>
                </div>
                <span className={styles.sectionToggle}>{openSections.education ? '▼' : '▶'}</span>
              </div>
              {openSections.education && (
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
                          <button className={styles.expRemove} onClick={() => setEducations(prev => prev.filter(x => x.id !== e.id))}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {showEduForm && (
                    <div className={styles.miniForm}>
                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Skola / Universitet *</label>
                          <input className={styles.formInput} placeholder="t.ex. KTH" value={eduForm.school} onChange={e => setEduForm(p => ({ ...p, school: e.target.value }))} />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Examen</label>
                          <input className={styles.formInput} placeholder="t.ex. Kandidatexamen" value={eduForm.degree} onChange={e => setEduForm(p => ({ ...p, degree: e.target.value }))} />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Inriktning</label>
                          <input className={styles.formInput} placeholder="t.ex. Datateknik" value={eduForm.field} onChange={e => setEduForm(p => ({ ...p, field: e.target.value }))} />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>År</label>
                          <input className={styles.formInput} placeholder="2018–2021" value={eduForm.years} onChange={e => setEduForm(p => ({ ...p, years: e.target.value }))} />
                        </div>
                      </div>
                      <div className={styles.miniFormActions}>
                        <button className={`${styles.btnSm} ${styles.btnSmCancel}`} onClick={() => setShowEduForm(false)}>Avbryt</button>
                        <button className={`${styles.btnSm} ${styles.btnSmPrimary}`} onClick={addEdu}>＋ Lägg till</button>
                      </div>
                    </div>
                  )}
                  {!showEduForm && (
                    <button className={styles.btnAdd} onClick={() => setShowEduForm(true)}>＋ Lägg till utbildning</button>
                  )}
                </div>
              )}
            </div>

            {/* ── SKILLS ── */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHead} onClick={() => toggleSection('skills')}>
                <div className={styles.sectionHeadLeft}>
                  <div className={`${styles.sectionIcon} ${styles.siPurple}`}>⚡</div>
                  <div>
                    <div className={styles.sectionHeadTitle}>Kompetenser</div>
                    <div className={styles.sectionHeadSub}>{skills.length} kompetenser</div>
                  </div>
                </div>
                <span className={styles.sectionToggle}>{openSections.skills ? '▼' : '▶'}</span>
              </div>
              {openSections.skills && (
                <div className={styles.sectionBody}>
                  <div className={styles.tagsWrap}>
                    {skills.map((s, i) => (
                      <span key={i} className={styles.tag}>
                        {s}
                        <button className={styles.tagRemove} onClick={() => setSkills(prev => prev.filter((_, j) => j !== i))}>✕</button>
                      </span>
                    ))}
                  </div>
                  <div className={styles.tagInputRow}>
                    <input className={`${styles.formInput} ${styles.tagInput}`} placeholder="t.ex. React, TypeScript, Python..."
                      value={skillInput} onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
                    <button className={`${styles.btn} ${styles.btnGhost}`} onClick={addSkill}>＋ Lägg till</button>
                  </div>
                </div>
              )}
            </div>

            {/* ── LANGUAGES ── */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHead} onClick={() => toggleSection('langs')}>
                <div className={styles.sectionHeadLeft}>
                  <div className={`${styles.sectionIcon} ${styles.siBlue}`}>🌍</div>
                  <div>
                    <div className={styles.sectionHeadTitle}>Språk</div>
                    <div className={styles.sectionHeadSub}>{languages.length} språk</div>
                  </div>
                </div>
                <span className={styles.sectionToggle}>{openSections.langs ? '▼' : '▶'}</span>
              </div>
              {openSections.langs && (
                <div className={styles.sectionBody}>
                  <div className={styles.tagsWrap}>
                    {languages.map((l, i) => (
                      <span key={i} className={styles.tag}>
                        {l}
                        <button className={styles.tagRemove} onClick={() => setLanguages(prev => prev.filter((_, j) => j !== i))}>✕</button>
                      </span>
                    ))}
                  </div>
                  <div className={styles.tagInputRow}>
                    <input className={`${styles.formInput} ${styles.tagInput}`} placeholder="t.ex. Svenska (modersmål), Engelska (flytande)..."
                      value={langInput} onChange={e => setLangInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLang(); } }} />
                    <button className={`${styles.btn} ${styles.btnGhost}`} onClick={addLang}>＋ Lägg till</button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      {/* Toast */}
      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </main>
  );
}