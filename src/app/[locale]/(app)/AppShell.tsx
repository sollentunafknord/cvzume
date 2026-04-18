'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import styles from './sidebar.module.css';
import DashboardClient from './dashboard/DashboardClient';
import ProfileClient from './profile/ProfileClient';
import SettingsClient from './settings/SettingsClient';
import UpgradeClient from './upgrade/UpgradeClient';
import LetterClient from './letter/LetterClient';
import ArchiveClient from './archive/ArchiveClient';
import CVClient from './cv/CVClient';

export default function AppShell() {
  const pathname = usePathname();
  const seg = pathname?.split('/')[2] ?? 'dashboard';

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.content}>
        {seg === 'dashboard' && <DashboardClient />}
        {seg === 'profile'   && <ProfileClient />}
        {seg === 'settings'  && <SettingsClient />}
        {seg === 'upgrade'   && <UpgradeClient />}
        {seg === 'letter'    && <LetterClient />}
        {seg === 'archive'   && <ArchiveClient />}
        {seg === 'cv'        && <CVClient />}
      </div>
    </div>
  );
}
