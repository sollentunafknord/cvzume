'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './cv.module.css';

interface Experience { role: string; company: string; start: string; end: string; desc: string; }
interface Education { degree: string; field: string; school: string; years: string; }

interface Profile {
  phone?: string; location?: string; title?: string; summary?: string;
  avatar_url?: string;
  experiences?: Experience[];
  educations?: Education[];
  skills?: string[];
  languages?: string[];
}

export default function CVClient() {
  const locale = useLocale();
  const router = useRouter();
  const paperRef = useRef<HTMLDivElement>(null);

  const [fullName, setFullName] = useState('Namn Efternamn');
  const [initials, setInitials] = useState('?');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profile, setProfile] = useState<Profile>({});
  const [aiSummary, setAiSummary] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [toolbarTitle, setToolbarTitle] = useState('CV Förhandsvisning');
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    const saved = localStorage.getItem('cvita_user');
    if (!saved) { router.push(`/${locale}/auth`); return; }
    const user = JSON.parse(saved);
    const token = localStorage.getItem('cvita_token');
    if (!token) { router.push(`/${locale}/auth`); return; }

    const fn = user.firstName || user.email?.split('@')[0] || '';
    const ln = user.lastName || '';
    const name = (fn + ' ' + ln).trim() || 'Namn Efternamn';
    setFullName(name);
    setInitials(((fn[0] || '') + (ln[0] || '')).toUpperCase() || '?');
    setEmail(user.email || '');

    const result = JSON.parse(localStorage.getItem('cvita_last_result') || '{}');
    if (result.role) {
      setJobRole(result.role);
      setToolbarTitle('CV — ' + result.role);
    }
    if (result.cvSummary) setAiSummary(result.cvSummary);

    const avatar = localStorage.getItem('cvita_avatar');
    if (avatar) setAvatarUrl(avatar);

    let prof: Profile = JSON.parse(localStorage.getItem('cvita_profile') || '{}');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (user.id) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=*`, {
          headers: { apikey: supabaseKey, Authorization: 'Bearer ' + token },
        });
        const rows = await res.json();
        if (rows.length > 0) {
          prof = { ...prof, ...rows[0] };
          localStorage.setItem('cvita_profile', JSON.stringify(prof));
          if (!avatar && rows[0].avatar_url) {
            setAvatarUrl(rows[0].avatar_url);
            localStorage.setItem('cvita_avatar', rows[0].avatar_url);
          }
        }
      } catch { /* silent */ }
    }
    setProfile(prof);
  }, [locale, router]);

  useEffect(() => { load(); }, [load]);

  function downloadPDF() {
    document.title = fullName + ' — CV';
    window.print();
  }

  function openPreview() { setShowModal(true); }
  function closePreview() { setShowModal(false); }
  function confirmPrint() { closePreview(); downloadPDF(); }

  const cvContent = (
    <>
      {/* Header */}
      <div className={styles.cvHeader}>
        <div className={styles.cvHeaderLeft}>
          <div className={styles.cvName}>{fullName}</div>
          {(profile.title || jobRole) && (
            <div className={styles.cvJobTitle}>{profile.title || jobRole}</div>
          )}
          <div className={styles.cvContacts}>
            {profile.location && <span className={styles.cvContact}>📍 {profile.location}</span>}
            {profile.phone && <span className={styles.cvContact}>📞 {profile.phone}</span>}
            {email && <span className={styles.cvContact}>✉️ {email}</span>}
          </div>
        </div>
        <div className={styles.cvAvatar}>
          {avatarUrl ? <img src={avatarUrl} alt={fullName} /> : initials}
        </div>
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div className={styles.cvAiBox}>
          <div className={styles.cvAiLabel}>🎯 Anpassad för tjänsten</div>
          <div className={styles.cvAiText}>{aiSummary}</div>
        </div>
      )}

      {/* Profil */}
      {profile.summary && (
        <div className={styles.cvSection}>
          <div className={styles.cvSectionTitle}>Profil</div>
          <div className={styles.cvSummary}>{profile.summary}</div>
        </div>
      )}

      {/* Erfarenhet */}
      {profile.experiences && profile.experiences.length > 0 && (
        <div className={styles.cvSection}>
          <div className={styles.cvSectionTitle}>Arbetslivserfarenhet</div>
          {profile.experiences.map((exp, i) => (
            <div key={i} className={styles.expItem}>
              <div className={styles.expHeader}>
                <div className={styles.expRole}>{exp.role}</div>
                <div className={styles.expDates}>{exp.start}{exp.end ? ' – ' + exp.end : ''}</div>
              </div>
              <div className={styles.expCompany}>{exp.company}</div>
              {exp.desc && <div className={styles.expDesc}>{exp.desc}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Two-column: Utbildning + Kompetenser & Språk */}
      <div className={styles.cvTwoCol}>
        {profile.educations && profile.educations.length > 0 && (
          <div className={styles.cvSection}>
            <div className={styles.cvSectionTitle}>Utbildning</div>
            {profile.educations.map((edu, i) => (
              <div key={i} className={styles.eduItem}>
                <div className={styles.eduDegree}>{edu.degree}{edu.field ? ' · ' + edu.field : ''}</div>
                <div className={styles.eduSchool}>{edu.school}</div>
                {edu.years && <div className={styles.eduYears}>{edu.years}</div>}
              </div>
            ))}
          </div>
        )}

        <div>
          {profile.skills && profile.skills.length > 0 && (
            <div className={styles.cvSection}>
              <div className={styles.cvSectionTitle}>Kompetenser</div>
              <div className={styles.cvSkills}>
                {profile.skills.map(s => <span key={s} className={styles.cvSkill}>{s}</span>)}
              </div>
            </div>
          )}
          {profile.languages && profile.languages.length > 0 && (
            <div className={styles.cvSection} style={{ marginTop: 24 }}>
              <div className={styles.cvSectionTitle}>Språk</div>
              {profile.languages.map(l => <div key={l} className={styles.cvLangItem}>{l}</div>)}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button className={styles.backBtn} onClick={() => router.push(`/${locale}/profile`)}>← Mitt CV</button>
          <span className={styles.toolbarTitle}>{toolbarTitle}</span>
        </div>
        <div className={styles.toolbarRight}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={openPreview}>👁 Förhandsgranska</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={downloadPDF}>📥 Ladda ner PDF</button>
        </div>
      </div>

      {/* CV Paper */}
      <div className={styles.pageWrapper}>
        <div className={styles.cvPaper} ref={paperRef}>
          {cvContent}
        </div>
      </div>

      {/* Preview Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closePreview}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>👁 Förhandsvisning — Klicka på Skriv ut för att spara som PDF</div>
              <button className={styles.modalClose} onClick={closePreview}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.cvPaper}>{cvContent}</div>
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={closePreview}>Stäng</button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={confirmPrint}>🖨️ Skriv ut / Spara PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}