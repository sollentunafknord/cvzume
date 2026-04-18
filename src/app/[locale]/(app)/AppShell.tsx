'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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

  function navigate(seg: string) {
    setPage(seg);                              // instant — React state, no waiting
    router.push(`/${locale}/${seg}`);          // async — updates URL in background
  }

  return (
    <div className={styles.layout}>
      <Sidebar activePage={page} onNavigate={navigate} />
      <div className={styles.content}>
        {page === 'dashboard' && <DashboardClient onNavigate={navigate} />}
        {page === 'profile'   && <ProfileClient />}
        {page === 'settings'  && <SettingsClient />}
        {page === 'upgrade'   && <UpgradeClient />}
        {page === 'letter'    && <LetterClient />}
        {page === 'archive'   && <ArchiveClient />}
        {page === 'cv'           && <CVClient />}
        {page === 'applications' && <ApplicationsClient />}
      </div>
    </div>
  );
}
