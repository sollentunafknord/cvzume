'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './settings.module.css';
import PersonalTab from './PersonalTab';
import PasswordTab from './PasswordTab';
import PlanTab from './PlanTab';
import LanguageTab from './LanguageTab';
import AccountTab from './AccountTab';

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

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const userName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToastMsg(msg: string, type: 'success' | 'error' = 'success') {
    setToast(msg); setToastType(type);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3500);
  }
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const loadUser = useCallback(() => {
    const saved = localStorage.getItem('cvita_user');
    if (!saved) { router.push(`/${locale}/auth`); return; }
    const user = JSON.parse(saved);
    const fn = user.firstName || user.email?.split('@')[0] || '';
    const ln = user.lastName || '';
    setFirstName(fn); setLastName(ln); setUserEmail(user.email || '');
    const av = localStorage.getItem('cvita_avatar');
    if (av) setAvatarUrl(av);
  }, [locale, router]);

  async function uploadAvatar(file: File) {
    if (file.size > 2 * 1024 * 1024) { showToastMsg('❌ Max 2 MB', 'error'); return; }
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
      if (!res.ok) throw new Error('Upload failed');
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${path}`;
      localStorage.setItem('cvita_avatar', publicUrl);
      setAvatarUrl(publicUrl);
      window.dispatchEvent(new CustomEvent('cvita_profile_updated'));
      if (token && user.id) {
        fetch(`${supabaseUrl}/rest/v1/profiles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: 'Bearer ' + token, Prefer: 'resolution=merge-duplicates' },
          body: JSON.stringify({ id: user.id, locale, avatar_url: publicUrl, updated_at: new Date().toISOString() }),
        }).catch(() => {});
      }
      showToastMsg('✅ ' + t('settings.avatar_saved'));
    } catch (err: unknown) {
      showToastMsg('❌ ' + (err instanceof Error ? err.message : 'Error'), 'error');
    } finally { setAvatarUploading(false); }
  }

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
    if (!firstName && !lastName) { showToastMsg(t('settings.name_required'), 'error'); return; }
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

  const tabs: { key: Tab; label: string }[] = [
    { key: 'personal', label: t('settings.personal') },
    { key: 'password', label: t('settings.password') },
    { key: 'plan', label: t('settings.plan') },
    { key: 'language', label: t('settings.language') },
    { key: 'account', label: t('settings.account') },
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

      {activeTab === 'personal' && (
        <PersonalTab
          firstName={firstName} setFirstName={setFirstName}
          lastName={lastName} setLastName={setLastName}
          userEmail={userEmail} initials={initials} userName={userName}
          saving={savingPersonal} onSave={savePersonalInfo}
          avatarUrl={avatarUrl} avatarUploading={avatarUploading} onAvatarUpload={uploadAvatar}
          t={t}
        />
      )}
      {activeTab === 'password' && <PasswordTab onToast={showToastMsg} />}
      {activeTab === 'plan' && <PlanTab planInfo={planInfo} planLoading={planLoading} />}
      {activeTab === 'language' && <LanguageTab />}
      {activeTab === 'account' && <AccountTab onToast={showToastMsg} />}

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''} ${toastType === 'error' ? styles.toastError : styles.toastSuccess}`}>
        {toast}
      </div>
    </main>
  );
}
