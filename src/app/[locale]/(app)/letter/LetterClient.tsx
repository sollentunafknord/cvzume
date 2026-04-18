'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './letter.module.css';

export default function LetterClient() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);

  const [fullName, setFullName] = useState('Namn Efternamn');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [company, setCompany] = useState('Företaget');
  const [subject, setSubject] = useState('Ansökan — Tjänst');
  const [letterText, setLetterText] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'copy'>('copy');

  function showToast(msg: string, type: 'success' | 'error' | 'copy' = 'copy') {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 3000);
  }

  const loadLetter = useCallback(async () => {
    const saved = localStorage.getItem('cvita_user');
    if (!saved) { router.push(`/${locale}/auth`); return; }
    const user = JSON.parse(saved);
    const fn = user.firstName || user.email?.split('@')[0] || '';
    const ln = user.lastName || '';
    const name = (fn + ' ' + ln).trim() || 'Namn Efternamn';
    setFullName(name);
    setEmail(user.email || '');

    const localeMap: Record<string, string> = { en: 'en-GB', es: 'es-ES', tr: 'tr-TR', sv: 'sv-SE' };
    setDateStr(new Date().toLocaleDateString(localeMap[locale] || 'sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }));

    const result = JSON.parse(localStorage.getItem('cvita_last_result') || '{}');
    if (result.role) setSubject('Ansökan — ' + result.role);
    if (result.employer) setCompany(result.employer);

    let profile = JSON.parse(localStorage.getItem('cvita_profile') || '{}');
    const token = localStorage.getItem('cvita_token');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (token && user.id && !profile.phone) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=*`, {
          headers: { apikey: supabaseKey, Authorization: 'Bearer ' + token },
        });
        const rows = await res.json();
        if (rows.length > 0) {
          profile = rows[0];
          localStorage.setItem('cvita_profile', JSON.stringify(profile));
        }
      } catch { /* silent */ }
    }

    if (profile.phone) setPhone(profile.phone);
    if (profile.location) setLocation(profile.location);

    if (result.coverLetter) setLetterText(result.coverLetter);
    else if (profile.cover_letter) setLetterText(profile.cover_letter);
    else setLetterText('');
  }, [locale, router]);

  useEffect(() => { loadLetter(); }, [loadLetter]);

  async function toggleEdit() {
    if (!isEditing) {
      setIsEditing(true);
      setTimeout(() => contentRef.current?.focus(), 50);
    } else {
      const editedText = contentRef.current?.innerText || letterText;
      setLetterText(editedText);
      setIsEditing(false);

      const result = JSON.parse(localStorage.getItem('cvita_last_result') || '{}');
      result.coverLetter = editedText;
      localStorage.setItem('cvita_last_result', JSON.stringify(result));

      const token = localStorage.getItem('cvita_token');
      const user = JSON.parse(localStorage.getItem('cvita_user') || '{}');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      if (token && user.id) {
        try {
          const res = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: 'Bearer ' + token, Prefer: 'resolution=merge-duplicates' },
            body: JSON.stringify({ id: user.id, cover_letter: editedText, updated_at: new Date().toISOString() }),
          });
          showToast(res.ok ? '✅ Brevet sparat!' : '❌ Kunde inte spara', res.ok ? 'success' : 'error');
        } catch { showToast('❌ Kunde inte spara', 'error'); }
      }
    }
  }

  function copyLetter() {
    const text = contentRef.current?.innerText || letterText;
    navigator.clipboard.writeText(text).then(() => showToast('✅ Kopierat till urklipp!'));
  }

  async function generateLetter() {
    const result = JSON.parse(localStorage.getItem('cvita_last_result') || '{}');
    const profile = JSON.parse(localStorage.getItem('cvita_profile') || '{}');
    if (!result.jobAd && !result.role) {
      showToast('❌ Inget jobb hittades. Gå till Favoriter och analysera ett jobb först.', 'error');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobAd: result.jobAd || result.role, userProfile: profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fel');
      setLetterText(data.coverLetter || '');
      result.coverLetter = data.coverLetter;
      localStorage.setItem('cvita_last_result', JSON.stringify(result));
      showToast('✅ Nytt brev genererat!', 'success');
    } catch {
      showToast('❌ Kunde inte generera brev. Försök igen.', 'error');
    } finally {
      setGenerating(false);
    }
  }

  function downloadPDF() {
    document.title = subject || 'Personligt Brev';
    window.print();
  }

  return (
    <main className={styles.main}>
        {/* TOOLBAR */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <span className={styles.toolbarTitle}>{subject}</span>
          </div>
          <div className={styles.toolbarRight}>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={generateLetter} disabled={generating}>
              {generating ? '⏳ Genererar...' : '✨ Generera nytt brev'}
            </button>
            <button className={`${styles.btn} ${isEditing ? styles.btnActive : styles.btnGhost}`} onClick={toggleEdit}>
              ✏️ {isEditing ? 'Spara' : 'Redigera'}
            </button>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={copyLetter}>📋 Kopiera</button>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={downloadPDF}>📥 Ladda ner PDF</button>
          </div>
        </div>

        {/* LETTER PAPER */}
        <div className={styles.letterPaper}>
          {/* Header */}
          <div className={styles.letterHeader}>
            <div className={styles.letterHeaderContent}>
              <div className={styles.letterSenderName}>{fullName}</div>
              <div className={styles.letterContacts}>
                {email && <span className={styles.letterContact}>📧 {email}</span>}
                {phone && <span className={styles.letterContact}>📞 {phone}</span>}
                {location && <span className={styles.letterContact}>📍 {location}</span>}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className={styles.letterBody}>
            <div className={styles.letterMeta}>
              <div className={styles.letterDate}>{dateStr}</div>
              <div className={styles.letterRecipient}>
                <strong>{company}</strong><br />
                <span>Till rekryteringsansvarig</span>
              </div>
            </div>

            <div className={styles.letterSubject}>{subject}</div>

            {letterText ? (
              <div
                ref={contentRef}
                className={styles.letterContent}
                contentEditable={isEditing}
                suppressContentEditableWarning
              >
                {letterText}
              </div>
            ) : (
              <div className={styles.letterEmpty}>
                <div className={styles.letterEmptyIcon}>✉️</div>
                <div className={styles.letterEmptyTitle}>Inget personligt brev ännu</div>
                <p className={styles.letterEmptyDesc}>Gå till <strong>Sök jobb → Favoriter</strong> och analysera ett jobb — eller klicka på knappen ovan för att generera ett brev baserat på ditt senaste jobb.</p>
              </div>
            )}

            {isEditing && (
              <div className={styles.editHint}>Klicka i texten för att redigera</div>
            )}

            <div className={styles.letterSignature}>
              <div className={styles.letterSigLine}>Med vänliga hälsningar,</div>
              <div className={styles.letterSigName}>{fullName}</div>
            </div>
          </div>
        </div>
      {/* Toast */}
      <div className={`${styles.toast} ${toast ? styles.toastShow : ''} ${toastType === 'success' ? styles.toastSuccess : toastType === 'error' ? styles.toastError : styles.toastCopy}`}>
        {toast}
      </div>
    </main>
  );
}