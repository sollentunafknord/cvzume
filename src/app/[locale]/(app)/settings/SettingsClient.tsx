'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './settings.module.css';

type Tab = 'personal' | 'password' | 'plan' | 'language' | 'account';

interface PlanInfo {
  plan: 'pro' | 'free';
  interval?: 'monthly' | 'yearly';
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export default function SettingsClient() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [userEmail, setUserEmail] = useState('');
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // personal tab
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [savingPersonal, setSavingPersonal] = useState(false);

  // password tab
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwStrength, setPwStrength] = useState(0);
  const [savingPw, setSavingPw] = useState(false);

  // plan tab
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  // account delete
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  function showToastMsg(msg: string, type: 'success' | 'error' = 'success') {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 3500);
  }

  const loadUser = useCallback(() => {
    const saved = localStorage.getItem('cvita_user');
    if (!saved) { router.push(`/${locale}/auth`); return; }
    const user = JSON.parse(saved);
    const fn = user.firstName || user.email?.split('@')[0] || '';
    const ln = user.lastName || '';
    setFirstName(fn); setLastName(ln); setUserEmail(user.email || '');
  }, [locale, router]);

  useEffect(() => { loadUser(); }, [loadUser]);

  async function loadPlan() {
    setPlanLoading(true);
    try {
      const email = userEmail || JSON.parse(localStorage.getItem('cvita_user') || '{}').email || '';
      const res = await fetch(`/api/stripe/subscription?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setPlanInfo(data);
      localStorage.setItem('cvita_is_pro', data.plan === 'pro' ? 'true' : 'false');
    } catch { setPlanInfo({ plan: 'free' }); }
    finally { setPlanLoading(false); }
  }

  useEffect(() => {
    if (activeTab === 'plan') loadPlan();
  }, [activeTab]); // eslint-disable-line

  async function savePersonalInfo() {
    if (!firstName && !lastName) { showToastMsg('Ange minst ett namn', 'error'); return; }
    setSavingPersonal(true);
    const token = localStorage.getItem('cvita_token');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: 'Bearer ' + token },
        body: JSON.stringify({ data: { first_name: firstName, last_name: lastName } }),
      });
      if (!res.ok) throw new Error('Supabase fel');
      const user = JSON.parse(localStorage.getItem('cvita_user') || '{}');
      user.firstName = firstName; user.lastName = lastName;
      localStorage.setItem('cvita_user', JSON.stringify(user));
      showToastMsg('✅ ' + t('settings.save'));
    } catch (e: unknown) {
      showToastMsg('❌ ' + (e instanceof Error ? e.message : 'Fel'), 'error');
    } finally { setSavingPersonal(false); }
  }

  function calcStrength(pw: string) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    setPwStrength(s);
  }

  const strengthLevels = [
    { w: '20%', color: '#EF4444', label: t('auth.strength_weak') },
    { w: '40%', color: '#F97316', label: t('auth.strength_weak') },
    { w: '60%', color: '#EAB308', label: t('auth.strength_medium') },
    { w: '80%', color: '#22C55E', label: t('auth.strength_strong') },
    { w: '100%', color: '#059669', label: t('auth.strength_strong') },
  ];
  const strengthLevel = pwStrength > 0 ? strengthLevels[Math.min(pwStrength - 1, 4)] : null;

  async function changePassword() {
    if (!currentPw) { showToastMsg('Ange nuvarande lösenord', 'error'); return; }
    if (newPw.length < 8) { showToastMsg(t('auth.error_password_short'), 'error'); return; }
    if (newPw !== confirmPw) { showToastMsg('Lösenorden matchar inte', 'error'); return; }
    setSavingPw(true);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const user = JSON.parse(localStorage.getItem('cvita_user') || '{}');
    try {
      const verifyRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: supabaseKey },
        body: JSON.stringify({ email: user.email, password: currentPw }),
      });
      if (!verifyRes.ok) { showToastMsg('Nuvarande lösenord är felaktigt', 'error'); return; }
      const { access_token } = await verifyRes.json();
      const updateRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: 'Bearer ' + access_token },
        body: JSON.stringify({ password: newPw }),
      });
      if (!updateRes.ok) throw new Error('Uppdatering misslyckades');
      setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwStrength(0);
      showToastMsg('✅ Lösenord uppdaterat!');
    } catch (e: unknown) {
      showToastMsg('❌ ' + (e instanceof Error ? e.message : 'Fel'), 'error');
    } finally { setSavingPw(false); }
  }

  async function deleteAccount() {
    if (!deletePassword) { showToastMsg('Ange ditt lösenord', 'error'); return; }
    if (!confirm('⚠️ Radera ditt konto permanent? Detta kan INTE ångras.')) return;
    if (!confirm('Är du helt säker? Klicka OK för att radera.')) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('cvita_token');
      const res = await fetch('/api/auth/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: deletePassword }),
      });
      if (!res.ok) throw new Error('Radering misslyckades');
      localStorage.clear();
      router.push(`/${locale}/auth`);
    } catch (e: unknown) {
      showToastMsg('❌ ' + (e instanceof Error ? e.message : 'Fel'), 'error');
    } finally { setDeleting(false); }
  }

  const LANGS = [
    { code: 'sv', flag: '🇸🇪', name: 'Svenska', sub: 'Gränssnittet visas på svenska' },
    { code: 'en', flag: 'EN', name: 'English', sub: 'Interface displayed in English' },
    { code: 'es', flag: '🇪🇸', name: 'Español', sub: 'La interfaz se muestra en español' },
    { code: 'tr', flag: '🇹🇷', name: 'Türkçe', sub: 'Arayüz Türkçe görüntülenir' },
  ];

  function changeLanguage(code: string) {
    localStorage.setItem('cvita_language', code);
    router.push(`/${code}/settings`);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'personal', label: t('settings.personal') },
    { key: 'password', label: t('settings.password') },
    { key: 'plan', label: t('settings.plan') },
    { key: 'language', label: t('settings.language') },
    { key: 'account', label: 'Konto' },
  ];

  return (
    <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div className={styles.pageTitle}>{t('settings.title')}</div>
          <div className={styles.pageSubtitle}>{t('settings.subtitle')}</div>
        </div>

        <div className={styles.settingsTabs}>
          {tabs.map(tab => (
            <button key={tab.key} className={`${styles.tabBtn} ${activeTab === tab.key ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── PERSONAL TAB ── */}
        {activeTab === 'personal' && (
          <div className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderIcon}>👤</div>
              <div>
                <div className={styles.cardHeaderTitle}>Personlig information</div>
                <div className={styles.cardHeaderDesc}>Uppdatera ditt namn och e-postadress</div>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.avatarSection}>
                <div className={styles.avatarCircle}>{initials}</div>
                <div>
                  <div className={styles.avatarName}>{userName || 'Namn Efternamn'}</div>
                  <div className={styles.avatarEmail}>{userEmail}</div>
                </div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Förnamn</label>
                  <input className={styles.formInput} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Anna" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Efternamn</label>
                  <input className={styles.formInput} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Lindström" />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: '1/-1' }}>
                  <label className={styles.formLabel}>E-postadress</label>
                  <input className={styles.formInput} value={userEmail} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                </div>
              </div>
              <div className={styles.formActions}>
                <button className={styles.btnPrimary} onClick={savePersonalInfo} disabled={savingPersonal}>
                  {savingPersonal ? 'Sparar...' : t('settings.save')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PASSWORD TAB ── */}
        {activeTab === 'password' && (
          <div className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderIcon}>🔒</div>
              <div>
                <div className={styles.cardHeaderTitle}>Byt lösenord</div>
                <div className={styles.cardHeaderDesc}>Välj ett starkt lösenord med minst 8 tecken</div>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGroup} style={{ marginBottom: 16 }}>
                <label className={styles.formLabel}>Nuvarande lösenord</label>
                <div className={styles.formInputWrap}>
                  <input className={styles.formInput} type={showCurrentPw ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Ange nuvarande lösenord" />
                  <button className={styles.pwToggle} onClick={() => setShowCurrentPw(p => !p)}>{showCurrentPw ? '🙈' : '👁'}</button>
                </div>
              </div>
              <div className={styles.formGroup} style={{ marginBottom: 16 }}>
                <label className={styles.formLabel}>Nytt lösenord</label>
                <div className={styles.formInputWrap}>
                  <input className={styles.formInput} type={showNewPw ? 'text' : 'password'} value={newPw}
                    onChange={e => { setNewPw(e.target.value); calcStrength(e.target.value); }}
                    placeholder="Minst 8 tecken" />
                  <button className={styles.pwToggle} onClick={() => setShowNewPw(p => !p)}>{showNewPw ? '🙈' : '👁'}</button>
                </div>
                {newPw && strengthLevel && (
                  <>
                    <div className={styles.pwStrengthBar}>
                      <div className={styles.pwStrengthFill} style={{ width: strengthLevel.w, background: strengthLevel.color }} />
                    </div>
                    <div className={styles.pwStrengthLabel} style={{ color: strengthLevel.color }}>{strengthLevel.label}</div>
                  </>
                )}
              </div>
              <div className={styles.formGroup} style={{ marginBottom: 16 }}>
                <label className={styles.formLabel}>Bekräfta nytt lösenord</label>
                <div className={styles.formInputWrap}>
                  <input className={styles.formInput} type={showConfirmPw ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Upprepa nytt lösenord" />
                  <button className={styles.pwToggle} onClick={() => setShowConfirmPw(p => !p)}>{showConfirmPw ? '🙈' : '👁'}</button>
                </div>
              </div>
              <div className={styles.formActions}>
                <button className={styles.btnPrimary} onClick={changePassword} disabled={savingPw}>
                  {savingPw ? 'Sparar...' : 'Byt lösenord'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PLAN TAB ── */}
        {activeTab === 'plan' && (
          <div className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderIcon}>⚡</div>
              <div>
                <div className={styles.cardHeaderTitle}>Din plan</div>
                <div className={styles.cardHeaderDesc}>Nuvarande prenumeration</div>
              </div>
            </div>
            <div className={styles.cardBody}>
              {planLoading && <div style={{ color: 'var(--muted)', fontSize: 14 }}>Laddar planinformation...</div>}
              {!planLoading && planInfo?.plan === 'pro' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)' }}>
                        CVzume Pro <span className={styles.planBadgePro}>Pro</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                        {planInfo.interval === 'yearly' ? 'Årsplan' : 'Månadsplan'}
                        {planInfo.currentPeriodEnd && ` · Förnyas ${new Date(planInfo.currentPeriodEnd).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                      </div>
                      {planInfo.cancelAtPeriodEnd && (
                        <div style={{ color: '#F97316', fontSize: 13, marginTop: 6 }}>⚠️ Avslutas vid periodens slut</div>
                      )}
                    </div>
                  </div>
                  <div className={styles.planBenefits}>
                    <div className={styles.planBenefitsTitle}>✅ Dina Pro-förmåner</div>
                    <div className={styles.planBenefitsList}>
                      <div>• Obegränsade CV-analyser</div>
                      <div>• Obegränsade personliga brev</div>
                      <div>• PDF-export</div>
                      <div>• Prioriterad AI</div>
                    </div>
                  </div>
                  {planInfo.interval === 'monthly' && (
                    <div className={styles.planUpgradeHint}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#C2410C', marginBottom: 4 }}>💡 Spara med årsplan</div>
                      <div style={{ fontSize: 13, color: '#9A3412' }}>Byt till årsplan och betala 999 SEK/år — spara 309 SEK!</div>
                      <button className={styles.btnPrimary} style={{ marginTop: 12, fontSize: 13, padding: '8px 16px' }}
                        onClick={() => router.push(`/${locale}/upgrade`)}>Byt till årsplan</button>
                    </div>
                  )}
                </div>
              )}
              {!planLoading && planInfo?.plan !== 'pro' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)' }}>
                        Gratis <span className={styles.planBadgeFree}>Gratis</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>2 CV-analyser per månad</div>
                    </div>
                    <button className={styles.btnPrimary} onClick={() => router.push(`/${locale}/upgrade`)}>⚡ Uppgradera till Pro</button>
                  </div>
                  <div className={styles.planUpgradeHint}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#C2410C', marginBottom: 8 }}>🚀 Vad du får med Pro</div>
                    <div style={{ fontSize: 13, color: '#9A3412', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div>• Obegränsade CV-analyser</div>
                      <div>• Obegränsade personliga brev</div>
                      <div>• PDF-export</div>
                      <div>• Prioriterad AI</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── LANGUAGE TAB ── */}
        {activeTab === 'language' && (
          <div className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderIcon}>🌐</div>
              <div>
                <div className={styles.cardHeaderTitle}>Språk / Language / Dil</div>
                <div className={styles.cardHeaderDesc}>Välj vilket språk gränssnittet visas på</div>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.langOptions}>
                {LANGS.map(lang => (
                  <button key={lang.code} className={`${styles.langOptionBtn} ${locale === lang.code ? styles.active : ''}`}
                    onClick={() => changeLanguage(lang.code)}>
                    <span className={styles.langFlag} style={lang.code === 'en' ? { fontSize: 16, fontWeight: 700, color: '#374151' } : {}}>
                      {lang.flag}
                    </span>
                    <div>
                      <div className={styles.langName}>{lang.name}</div>
                      <div className={styles.langSub}>{lang.sub}</div>
                    </div>
                    <span className={styles.langCheck}>{locale === lang.code ? '✓' : ''}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ACCOUNT DELETE TAB ── */}
        {activeTab === 'account' && (
          <div className={`${styles.settingsCard} ${styles.dangerCard}`}>
            <div className={`${styles.cardHeader} ${styles.dangerHeader}`}>
              <div className={`${styles.cardHeaderIcon} ${styles.dangerHeaderIcon}`}>🗑</div>
              <div>
                <div className={`${styles.cardHeaderTitle} ${styles.dangerTitle}`}>Radera konto</div>
                <div className={styles.cardHeaderDesc}>Permanent borttagning av alla dina uppgifter</div>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.dangerWarn}>
                <div className={styles.dangerWarnTitle}>⚠️ Detta går inte att ångra</div>
                <div className={styles.dangerWarnList}>
                  <div>• Ditt CV och all profilinformation raderas permanent</div>
                  <div>• Dina personliga brev och analyser tas bort</div>
                  <div>• Ditt profilfoto raderas</div>
                  <div>• Din e-postadress blockeras från framtida registreringar</div>
                </div>
              </div>
              <div className={styles.formGroup} style={{ marginBottom: 20 }}>
                <label className={styles.formLabel}>Bekräfta med ditt lösenord</label>
                <input className={styles.formInput} type="password" placeholder="Ditt lösenord"
                  value={deletePassword} onChange={e => setDeletePassword(e.target.value)} />
              </div>
              <button className={`${styles.btnPrimary} ${styles.btnDanger}`} onClick={deleteAccount} disabled={deleting}>
                {deleting ? 'Raderar...' : '🗑 Radera mitt konto permanent'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Toast */}
      <div className={`${styles.toast} ${toast ? styles.toastShow : ''} ${toastType === 'error' ? styles.toastError : styles.toastSuccess}`}>
        {toast}
      </div>
    </main>
  );
}