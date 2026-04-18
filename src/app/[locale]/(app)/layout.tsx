import type { ReactNode } from 'react';
import AppShell from './AppShell';

export default function AppLayout({ children }: { children: ReactNode }) {
  void children;
  return <AppShell />;
}
