'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './auth.module.css';

type Tab = 'login' | 'register';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const LANGS = [
  { code: 'sv', label: '🇸🇪 Svenska' },
  { code: 'en', label: '🇬🇧 English' },
  { code: 'tr', label: '🇹🇷 Türkçe' },
  { code: 'es', label: '🇪🇸 Español' },
];

export default function AuthClient() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [regFname, setRegFname] = useState('');
  const [regLname, setRegLname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPw, setRegPw] = useState('');
  const [showRegPw, setShowRegPw] = useState(false);
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [pwStrength, setPwStrength] = useState(0);

  const [selectedLang, setSelectedLang] = useState(locale);
  const [success, setSuccess] = useState(false);
  const [successName, setSuccessName] = useState('');

  function checkStrength(pw: string) {
    if (!pw) { setPwStrength(0); return; }
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    setPwStrength(score);
  }

  function pwBarClass(index: number) {
    if (index >= pwStrength) return styles.pwBar;
    const cls = pwStrength <= 1 ? styles.pwBarWeak : pwStrength === 2 ? styles.pwBarMedium : styles.pwBarStrong;
    return `${styles.pwBar} ${cls}`;
  }

  function pwLabel() {
    if (!pwStrength) return '';
    if (pwStrength <= 1) return t('strength_weak');
    if (pwStrength === 2) return t('strength_medium');
    return t('strength_strong');
  }

  function pwLabelColor() {
    if (pwStrength <= 1) return '#EF4444';
    if (pwStrength === 2) return '#F59E0B';
    return '#059669';
  }

  async function hashEmail(email: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(email.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function handleLogin() {
    if (!loginEmail || !loginPw) { setLoginError(t('error_fill_all')); return; }
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPw }),
      });
      const data = await res.json();

      if (!res.ok) {
        const err = data.error || '';
        let msg = t('error_invalid');
        if (err.includes('Email not confirmed')) msg = t('error_not_confirmed');
        else if (err.includes('Too many requests')) msg = t('error_too_many');
        else if (err.includes('User not found')) msg = t('error_user_not_found');
        setLoginError(msg);
        return;
      }

      if (data.session) {
        localStorage.setItem('cvita_token', data.session.access_token);
        localStorage.setItem('cvita_refresh_token', data.session.refresh_token);
        localStorage.setItem('cvita_token_expiry', String(Date.now() + data.session.expires_in * 1000));
        localStorage.setItem('cvita_user', JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.user_metadata?.first_name || '',
          lastName: data.user.user_metadata?.last_name || '',
        }));
        localStorage.setItem('cvita_language', selectedLang);
      }
      ['cvita_active_page','cvita_profile','cvita_last_result','cvita_pdf_count','cvita_avatar','cvita_open_app','cvita_plan_label','cvita_is_pro'].forEach(k => localStorage.removeItem(k));
      router.push(`/${locale}/dashboard`);
    } catch {
      setLoginError(t('error_generic'));
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister() {
    if (!regFname || !regEmail || !regPw) { setRegError(t('error_fill_all')); return; }
    if (regPw.length < 8) { setRegError(t('error_password_short')); return; }
    setRegError('');
    setRegLoading(true);

    try {
      const emailHash = await hashEmail(regEmail);
      const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/deleted_accounts?email_hash=eq.${emailHash}`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      });
      if (checkRes.ok) {
        const rows = await checkRes.json();
        if (rows.length > 0) {
          setRegError(t('error_account_deleted'));
          setRegLoading(false);
          return;
        }
      }
    } catch { /* continue if check fails */ }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, password: regPw, firstName: regFname, lastName: regLname }),
      });
      const data = await res.json();

      if (!res.ok) {
        const err = data.error || '';
        let msg = t('error_generic');
        if (err.includes('already registered') || err.includes('already exists')) msg = t('error_already_registered');
        else if (err.includes('Password should be')) msg = t('error_password_short');
        setRegError(msg);
        return;
      }

      localStorage.setItem('cvita_language', selectedLang);
      setSuccessName(regFname);
      setSuccess(true);
    } catch {
      setRegError(t('error_generic'));
    } finally {
      setRegLoading(false);
    }
  }

  async function signInWithOAuth(provider: 'google' | 'github') {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth-callback.html?lang=${selectedLang}` },
    });
  }

  const EyeIcon = ({ visible }: { visible: boolean }) => visible
    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

  const GoogleIcon = () => (
    <svg viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );

  const GitHubIcon = () => (
    <svg viewBox="0 0 24 24" style={{ fill: '#24292e', width: 20, height: 20 }}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );

  const SocialButtons = () => (
    <>
      <div className={styles.authDivider}>
        <div className={styles.authDividerLine}/>
        <span className={styles.authDividerText}>{t('or_continue')}</span>
        <div className={styles.authDividerLine}/>
      </div>
      <div className={styles.socialButtons}>
        <button className={styles.btnSocial} onClick={() => signInWithOAuth('google')}>
          <GoogleIcon/> {t('google_btn')}
        </button>
        <button className={styles.btnSocial} onClick={() => signInWithOAuth('github')}>
          <GitHubIcon/> {t('github_btn')}
        </button>
      </div>
    </>
  );

  return (
    <div className={styles.page}>
      {/* ── LEFT PANEL ── */}
      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <a href={`/${locale}`} className={styles.leftLogo}>CV<span>zume</span></a>
          <h2 className={styles.leftHeadline}>
            {t('headline_1')}<br/>
            {t('headline_2_pre')}<em>{t('headline_2_em')}</em>
          </h2>
          <p className={styles.leftSub}>{t('sub')}</p>
          <div className={styles.leftFeatures}>
            {[
              { icon: '🎯', title: t('feature1_title'), desc: t('feature1_desc') },
              { icon: '⚡', title: t('feature2_title'), desc: t('feature2_desc') },
              { icon: '🔒', title: t('feature3_title'), desc: t('feature3_desc') },
            ].map(f => (
              <div key={f.icon} className={styles.leftFeature}>
                <div className={styles.leftFeatureIcon}>{f.icon}</div>
                <div className={styles.leftFeatureText}>
                  <div className={styles.leftFeatureTitle}>{f.title}</div>
                  <div className={styles.leftFeatureDesc}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.leftTestimonial}>
          <div className={styles.testimonialQuote}>"{t('testimonial_quote')}"</div>
          <div className={styles.testimonialAuthor}>
            <div className={styles.testimonialAvatar}>AL</div>
            <div>
              <div className={styles.testimonialName}>{t('testimonial_name')}</div>
              <div className={styles.testimonialRole}>{t('testimonial_role')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className={styles.rightPanel}>
        <a href={`/${locale}`} className={styles.backLink}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          {t('back_link')}
        </a>

        <div className={styles.authBox}>
          {success ? (
            <div className={styles.successMessage}>
              <div className={styles.successIcon}>✅</div>
              <h2 className={styles.successTitle}>{t('success_title')}</h2>
              <p className={styles.successSub}>{t('success_sub').replace('{name}', successName)}</p>
              <button className={styles.btnSubmit} onClick={() => router.push(`/${locale}/dashboard`)}>
                {t('go_dashboard')}
              </button>
            </div>
          ) : (
            <>
              <h1 className={styles.authTitle}>
                {tab === 'login' ? t('welcome_back') : t('create_account_title')}
              </h1>
              <p className={styles.authSub}>
                {tab === 'login' ? t('login_subtitle') : t('register_subtitle')}
              </p>

              <div className={styles.authTabs}>
                <button
                  className={`${styles.authTab} ${tab === 'login' ? styles.active : ''}`}
                  onClick={() => { setTab('login'); setLoginError(''); }}
                >{t('tab_login')}</button>
                <button
                  className={`${styles.authTab} ${tab === 'register' ? styles.active : ''}`}
                  onClick={() => { setTab('register'); setRegError(''); }}
                >{t('tab_register')}</button>
              </div>

              {tab === 'login' ? (
                <div className={styles.authForm}>
                  {loginError && <div className={styles.errorMsg}>{loginError}</div>}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t('email_label')}</label>
                    <input
                      className={styles.formInput}
                      type="email"
                      placeholder={t('email_placeholder')}
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t('password_label')}</label>
                    <div className={styles.inputWrap}>
                      <input
                        className={styles.formInput}
                        type={showLoginPw ? 'text' : 'password'}
                        placeholder={t('password_placeholder_login')}
                        value={loginPw}
                        onChange={e => setLoginPw(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        autoComplete="current-password"
                      />
                      <button className={styles.togglePw} type="button" onClick={() => setShowLoginPw(v => !v)} tabIndex={-1}>
                        <EyeIcon visible={showLoginPw}/>
                      </button>
                    </div>
                  </div>
                  <div className={styles.formFooterRow}>
                    <label className={styles.formCheck}>
                      <input type="checkbox"/> {t('remember_me')}
                    </label>
                    <a href="#" className={styles.forgotLink}>{t('forgot_password')}</a>
                  </div>
                  <button className={styles.btnSubmit} onClick={handleLogin} disabled={loginLoading}>
                    {loginLoading ? t('logging_in') : t('login_btn')}
                  </button>
                  <SocialButtons/>
                </div>
              ) : (
                <div className={styles.authForm}>
                  {regError && <div className={styles.errorMsg}>{regError}</div>}
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>{t('firstname_label')}</label>
                      <input
                        className={styles.formInput}
                        type="text"
                        placeholder={t('firstname_placeholder')}
                        value={regFname}
                        onChange={e => setRegFname(e.target.value)}
                        autoComplete="given-name"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>{t('lastname_label')}</label>
                      <input
                        className={styles.formInput}
                        type="text"
                        placeholder={t('lastname_placeholder')}
                        value={regLname}
                        onChange={e => setRegLname(e.target.value)}
                        autoComplete="family-name"
                      />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t('email_label')}</label>
                    <input
                      className={styles.formInput}
                      type="email"
                      placeholder={t('email_placeholder')}
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t('password_label')}</label>
                    <div className={styles.inputWrap}>
                      <input
                        className={styles.formInput}
                        type={showRegPw ? 'text' : 'password'}
                        placeholder={t('password_placeholder_register')}
                        value={regPw}
                        onChange={e => { setRegPw(e.target.value); checkStrength(e.target.value); }}
                        autoComplete="new-password"
                      />
                      <button className={styles.togglePw} type="button" onClick={() => setShowRegPw(v => !v)} tabIndex={-1}>
                        <EyeIcon visible={showRegPw}/>
                      </button>
                    </div>
                    {regPw && (
                      <div className={styles.pwStrength}>
                        <div className={styles.pwStrengthBars}>
                          {[0,1,2,3].map(i => <div key={i} className={pwBarClass(i)}/>)}
                        </div>
                        <span className={styles.pwStrengthLabel} style={{ color: pwLabelColor() }}>
                          {pwLabel()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t('language_label')}</label>
                    <div className={styles.langBtns}>
                      {LANGS.map(l => (
                        <button
                          key={l.code}
                          type="button"
                          className={`${styles.langBtn} ${selectedLang === l.code ? styles.selected : ''}`}
                          onClick={() => { setSelectedLang(l.code); localStorage.setItem('cvita_language', l.code); }}
                        >{l.label}</button>
                      ))}
                    </div>
                  </div>
                  <button className={styles.btnSubmit} onClick={handleRegister} disabled={regLoading}>
                    {regLoading ? t('creating_account') : t('register_btn_free')}
                  </button>
                  <p className={styles.authTerms}>
                    {t('terms_pre')} <a href="#">{t('terms_link')}</a> {t('terms_and')} <a href="#">{t('privacy_link')}</a>.
                  </p>
                  <SocialButtons/>
                </div>
              )}

              <p className={styles.authSwitch}>
                {tab === 'login' ? (
                  <>{t('no_account_text')} <a href="#" onClick={e => { e.preventDefault(); setTab('register'); }}>{t('no_account_link')}</a></>
                ) : (
                  <>{t('has_account_text')} <a href="#" onClick={e => { e.preventDefault(); setTab('login'); }}>{t('has_account_link')}</a></>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}