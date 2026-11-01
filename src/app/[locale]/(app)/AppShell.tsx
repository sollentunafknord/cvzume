'use client';

import { flowPath } from '@/lib/flow-path';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authFetch, keepTokenFresh } from '@/lib/auth-client';
import { useLocale } from 'next-intl';
import Sidebar from './Sidebar';
import styles from './sidebar.module.css';
import DashboardClient from './dashboard/DashboardClient';
import ProfileClient from './profile/ProfileClient';
import SettingsClient from './settings/SettingsClient';
import UpgradeClient from './upgrade/UpgradeClient';
import LetterClient from './letter/LetterClient';
import ArchiveClient from './archive/ArchiveClient';
import CVClient from './cv/CVClient';
import ApplicationsClient from './applications/ApplicationsClient';
import SkickadeClient from './skickade/SkickadeClient';
import IntervjuClient from './intervju/IntervjuClient';
import AdminClient from './admin/AdminClient';
import NyAnsokanClient from './ny/NyAnsokanClient';
import AnsokningarClient from './ansokningar/AnsokningarClient';

export default function AppShell() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  const [page, setPage] = useState(() => pathname?.split('/')[2] || 'dashboard');

  // Keep in sync with browser back/forward
  useEffect(() => {
    const seg = pathname?.split('/')[2] || 'dashboard';
    setPage(seg);
  }, [pathname]);

  // Giriş anahtarı 1 saatte doluyor; uygulama açıkken taze tut
  useEffect(() => keepTokenFresh(), []);

  // Check pro status on app load and notify components
  useEffect(() => {
    const email = (() => { try { return JSON.parse(localStorage.getItem('cvita_user') || '{}').email || ''; } catch { return ''; } })();
    if (!email) return;
    authFetch('/api/stripe/subscription')
      .then(r => r.json())
      .then(data => {
        const isPro = data.plan === 'pro';
        const admin = data.admin === true;
        localStorage.setItem('cvita_is_pro', isPro ? 'true' : 'false');
        localStorage.setItem('cvita_is_admin', admin ? 'true' : 'false');
        window.dispatchEvent(new CustomEvent('cvita_pro_updated', { detail: { isPro, admin } }));
      })
      .catch(() => {});
  }, []);

  // Yeni başvuru artık rehberli akışta (flowPath: /tr/basvuru, /sv/ansok …)
  useEffect(() => {
    if (page === 'ny') window.location.replace(flowPath(locale));
    // CV'm: yeni akıştaki CV görünümü (eski profil sayfası yerine)
    if (page === 'profile' || page === 'cv') window.location.replace(`${flowPath(locale)}?cv=1`);
  }, [page, locale]);

  function navigate(seg: string) {
    setPage(seg);                              // instant — React state, no waiting
    router.push(`/${locale}/${seg}`);          // async — updates URL in background
  }

  return (
    <div className={styles.layout}>
      <Sidebar activePage={page} onNavigate={navigate} />
      <div className={styles.content}>
        {page === 'ny'        && <NyAnsokanClient onNavigate={navigate} />}
        {page === 'ansokningar' && <AnsokningarClient onNavigate={navigate} />}
        {page === 'dashboard' && <DashboardClient onNavigate={navigate} />}
        {page === 'profile'   && <ProfileClient />}
        {page === 'settings'  && <SettingsClient />}
        {page === 'upgrade'   && <UpgradeClient />}
        {page === 'letter'    && <LetterClient />}
        {page === 'archive'   && <ArchiveClient onNavigate={navigate} />}
        {page === 'skickade'  && <SkickadeClient onNavigate={navigate} />}
        {page === 'intervju'  && <IntervjuClient onNavigate={navigate} />}
        {page === 'cv'           && <CVClient />}
        {page === 'applications' && <ApplicationsClient />}
        {page === 'admin'        && <AdminClient />}
      </div>
    </div>
  );
}
