'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './profile.module.css';
import type { Experience, Education, Profile } from './types';
import CvSuggestionsBanner from './CvSuggestionsBanner';
import ExperienceSection from './ExperienceSection';
import EducationSection from './EducationSection';
import TagSection from './TagSection';

export default function ProfileClient() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [toast, setToast] = useState('');
  const [suggestions, setSuggestions] = useState<{
    role: string; employer: string; keyRequirements: string[]; cvSummary: string; tips: string[];
  } | null>(null);

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

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true, experience: false, education: false, skills: false, langs: false,
  });

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

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const loadUser = useCallback(async () => {
    const saved = localStorage.getItem('cvita_user');
    if (!saved) { router.push(`/${locale}/auth`); return; }
    const user = JSON.parse(saved);
    setFirstName(user.firstName || user.email?.split('@')[0] || '');
    setLastName(user.lastName || '');
    setEmail(user.email || '');

    const av = localStorage.getItem('cvita_avatar');
    if (av) setAvatarUrl(av);

    const token = localStorage.getItem('cvita_token');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (token && user.id) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&locale=eq.${locale}&select=*`, {
          headers: { apikey: supabaseKey, Authorization: 'Bearer ' + token },
        });
        if (res.ok) {
          const rows = await res.json();
          if (rows.length > 0) {
            const db = rows[0];
            localStorage.setItem(`cvita_profile_${locale}`, JSON.stringify({
              phone: db.phone || '', location: db.location || '', title: db.title || '',
              summary: db.summary || '', experiences: db.experiences || [],
              educations: db.educations || [], skills: db.skills || [], languages: db.languages || [],
            }));
            if (db.avatar_url && !av) {
              setAvatarUrl(db.avatar_url);
              localStorage.setItem('cvita_avatar', db.avatar_url);
            }
          }
        }
      } catch { /* silent */ }
    }
    const stored = localStorage.getItem(`cvita_profile_${locale}`) || localStorage.getItem('cvita_profile');
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

  useEffect(() => {
    loadUser();
    const sugg = localStorage.getItem('cvita_cv_suggestions');
    if (sugg) { try { setSuggestions(JSON.parse(sugg)); } catch { /* ignore */ } }
  }, [loadUser]);

  function toggleSection(key: string) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function saveAll() {
    const profile = { phone, location, title, summary, experiences, educations, skills, languages };
    localStorage.setItem(`cvita_profile_${locale}`, JSON.stringify(profile));
    const user = JSON.parse(localStorage.getItem('cvita_user') || '{}');
    user.firstName = firstName; user.lastName = lastName;
    localStorage.setItem('cvita_user', JSON.stringify(user));
    const token = localStorage.getItem('cvita_token');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (token && user.id) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: 'Bearer ' + token, Prefer: 'resolution=merge-duplicates' },
          body: JSON.stringify({ id: user.id, locale, phone, location, title, summary, experiences, educations, skills, languages, updated_at: new Date().toISOString() }),
        });
        if (!res.ok) { showToast(t('profile.save_error_server')); return; }
      } catch { showToast(t('profile.save_error_network')); return; }
    }
    showToast(t('profile.save_success'));
  }

  async function uploadAvatar(file: File) {
    if (file.size > 2 * 1024 * 1024) { alert(t('profile.photo_too_large')); return; }
    setAvatarUploading(true);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const token = localStorage.getItem('cvita_token');
    const user = JSON.parse(localStorage.getItem('cvita_user') || '{}');
    const path = `avatar_${Date.now()}.${file.name.split('.').pop()}`;
    try {
      const res = await fetch(`${supabaseUrl}/storage/v1/object/avatars/${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': file.type, 'x-upsert': 'true', apikey: supabaseKey },
        body: file,
      });
      if (!res.ok) throw new Error(t('profile.upload_failed'));
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${path}`;
      localStorage.setItem('cvita_avatar', publicUrl);
      setAvatarUrl(publicUrl);
      if (token && user.id) {
        fetch(`${supabaseUrl}/rest/v1/profiles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: 'Bearer ' + token, Prefer: 'resolution=merge-duplicates' },
          body: JSON.stringify({ id: user.id, locale, avatar_url: publicUrl, updated_at: new Date().toISOString() }),
        }).catch(() => {});
      }
      showToast(t('profile.photo_saved'));
    } catch (err: unknown) {
      showToast('❌ ' + (err instanceof Error ? err.message : t('profile.upload_failed')));
    } finally { setAvatarUploading(false); }
  }

  return (
    <main className={styles.main}>
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <span className={styles.topbarTitle}>{t('profile.title')}</span>
        </div>
        <div className={styles.topbarRight}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => router.push(`/${locale}/cv`)}>{t('profile.download_pdf')}</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveAll}>{t('profile.save_all')}</button>
        </div>
      </div>

      <div className={styles.content}>
        {suggestions && (
          <CvSuggestionsBanner
            suggestions={suggestions}
            onDismiss={() => { localStorage.removeItem('cvita_cv_suggestions'); setSuggestions(null); }}
          />
        )}

        <div className={styles.progressCard}>
          <div className={styles.progressText}>
            <div className={styles.progressTitle}>{t('profile.progress_title')}</div>
            <div className={styles.progressSub}>{t('profile.progress_sub')}</div>
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
                  <div className={styles.sectionHeadTitle}>{t('profile.personal_info')}</div>
                  <div className={styles.sectionHeadSub}>{firstName} {lastName}</div>
                </div>
              </div>
              <span className={styles.sectionToggle}>{openSections.personal ? '▼' : '▶'}</span>
            </div>
            {openSections.personal && (
              <div className={styles.sectionBody}>
                <div className={styles.avatarSection}>
                  <div className={styles.avatarPreview} onClick={() => avatarInputRef.current?.click()}>
                    {avatarUrl ? <img src={avatarUrl} alt="avatar" /> : <span className={styles.avatarInitials}>{initials}</span>}
                  </div>
                  <div className={styles.avatarInfo}>
                    <div className={styles.avatarTitle}>{t('profile.photo_label')}</div>
                    <div className={styles.avatarSub}>{t('profile.photo_hint')}</div>
                    <div className={styles.avatarBtns}>
                      <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => avatarInputRef.current?.click()}>{t('profile.photo_upload_btn')}</button>
                      {avatarUploading && <span className={styles.avatarUploading}>{t('profile.photo_uploading')}</span>}
                    </div>
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t('profile.field_firstname')}</label>
                    <input className={styles.formInput} value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t('profile.field_lastname')}</label>
                    <input className={styles.formInput} value={lastName} onChange={e => setLastName(e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t('profile.field_email')}</label>
                    <input className={styles.formInput} type="email" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t('profile.field_phone')}</label>
                    <input className={styles.formInput} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+46 70 123 45 67" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t('profile.field_location')}</label>
                    <input className={styles.formInput} value={location} onChange={e => setLocation(e.target.value)} placeholder="Stockholm" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t('profile.field_jobtitle')}</label>
                    <input className={styles.formInput} value={title} onChange={e => setTitle(e.target.value)} placeholder={t('profile.field_jobtitle_placeholder')} />
                  </div>
                  <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                    <label className={styles.formLabel}>{t('profile.field_summary')}</label>
                    <textarea className={`${styles.formInput} ${styles.formTextarea}`} value={summary} onChange={e => setSummary(e.target.value)} placeholder={t('profile.field_summary_placeholder')} />
                    <span className={styles.formHint}>{t('profile.field_summary_hint')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <ExperienceSection
            experiences={experiences}
            onAdd={exp => setExperiences(prev => [{ id: Date.now(), ...exp }, ...prev])}
            onRemove={id => setExperiences(prev => prev.filter(x => x.id !== id))}
            open={openSections.experience}
            onToggle={() => toggleSection('experience')}
          />

          <EducationSection
            educations={educations}
            onAdd={edu => setEducations(prev => [{ id: Date.now(), ...edu }, ...prev])}
            onRemove={id => setEducations(prev => prev.filter(x => x.id !== id))}
            open={openSections.education}
            onToggle={() => toggleSection('education')}
          />

          <TagSection
            icon="⚡" iconColor={styles.siPurple}
            title={t('profile.skills_title')}
            subtitle={t('profile.skills_subtitle', { count: skills.length })}
            items={skills}
            placeholder={t('profile.skills_placeholder')}
            open={openSections.skills} onToggle={() => toggleSection('skills')}
            onAdd={v => setSkills(prev => [...prev, v])}
            onRemove={i => setSkills(prev => prev.filter((_, j) => j !== i))}
          />

          <TagSection
            icon="🌍" iconColor={styles.siBlue}
            title={t('profile.languages_title')}
            subtitle={t('profile.languages_subtitle', { count: languages.length })}
            items={languages}
            placeholder={t('profile.languages_placeholder')}
            open={openSections.langs} onToggle={() => toggleSection('langs')}
            onAdd={v => setLanguages(prev => [...prev, v])}
            onRemove={i => setLanguages(prev => prev.filter((_, j) => j !== i))}
          />
        </div>
      </div>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </main>
  );
}
