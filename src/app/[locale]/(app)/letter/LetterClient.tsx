'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './letter.module.css';

export default function LetterClient() {
  const t = useTranslations('letter');
  const locale = useLocale();
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [company, setCompany] = useState('');
  const [subject, setSubject] = useState('');
  const [letterText, setLetterText] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'copy'>('copy');

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(msg: string, type: 'success' | 'error' | 'copy' = 'copy') {
    setToast(msg); setToastType(type);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  }
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const loadLetter = useCallback(async () => {
    const saved = localStorage.getItem('cvita_user');
    if (!saved) { router.push(`/${locale}/auth`); return; }
    const user = JSON.parse(saved);
    const fn = user.firstName || user.email?.split('@')[0] || '';
    const ln = user.lastName || '';
    setFullName((fn + ' ' + ln).trim() || '');
    setEmail(user.email || '');

    const localeMap: Record<string, string> = { en: 'en-GB', es: 'es-ES', tr: 'tr-TR', sv: 'sv-SE' };
    setDateStr(new Date().toLocaleDateString(localeMap[locale] || 'sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }));

    const result = JSON.parse(localStorage.getItem('cvita_last_result') || '{}');
    if (result.role) setSubject(t('application_prefix') + result.role);
    else setSubject(t('default_subject'));
    if (result.employer) setCompany(result.employer);

    let profile = JSON.parse(localStorage.getItem(`cvita_profile_${locale}`) || localStorage.getItem('cvita_profile') || '{}');
    const token = localStorage.getItem('cvita_token');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (token && user.id && !profile.phone) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&locale=eq.${locale}&select=*`, {
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
  }, [locale, router, t]);

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
            body: JSON.stringify({ id: user.id, locale, cover_letter: editedText, updated_at: new Date().toISOString() }),
          });
          showToast(res.ok ? t('saved') : t('save_error'), res.ok ? 'success' : 'error');
        } catch { showToast(t('save_error'), 'error'); }
      }
    }
  }

  function copyLetter() {
    const text = contentRef.current?.innerText || letterText;
    navigator.clipboard.writeText(text).then(() => showToast(t('copied')));
  }

  async function generateLetter() {
    const result = JSON.parse(localStorage.getItem('cvita_last_result') || '{}');
    const profile = JSON.parse(localStorage.getItem('cvita_profile') || '{}');
    if (!result.jobAd && !result.role) {
      showToast(t('no_job_error'), 'error');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobAd: result.jobAd || result.role, userProfile: profile, locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('generate_error'));
      setLetterText(data.coverLetter || '');
      result.coverLetter = data.coverLetter;
      localStorage.setItem('cvita_last_result', JSON.stringify(result));
      showToast(t('generated'), 'success');
    } catch {
      showToast(t('generate_error'), 'error');
    } finally {
      setGenerating(false);
    }
  }

  function downloadPDF() {
    document.title = subject || t('print_title');
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
              {generating ? t('generating') : t('generate_btn')}
            </button>
            <button className={`${styles.btn} ${isEditing ? styles.btnActive : styles.btnGhost}`} onClick={toggleEdit}>
              {isEditing ? t('save_btn') : t('edit_btn')}
            </button>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={copyLetter}>{t('copy_btn')}</button>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={downloadPDF}>{t('download_pdf')}</button>
          </div>
        </div>

        {/* LETTER PAPER */}
        <div className={styles.letterPaper}>
          {/* Print-only title */}
          <div className={styles.printTitle}>{t('print_title')}</div>

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
                <span>{t('to_hiring')}</span>
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
                <div className={styles.letterEmptyTitle}>{t('empty_title')}</div>
                <p className={styles.letterEmptyDesc}>{t('empty_desc')}</p>
              </div>
            )}

            {isEditing && (
              <div className={styles.editHint}>{t('edit_hint')}</div>
            )}

            <div className={styles.letterSignature}>
              <div className={styles.letterSigLine}>{t('signature')}</div>
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
