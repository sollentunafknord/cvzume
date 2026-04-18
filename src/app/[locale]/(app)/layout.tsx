import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import styles from './sidebar.module.css';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
