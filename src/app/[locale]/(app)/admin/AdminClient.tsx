'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import styles from './admin.module.css';

const ADMIN_EMAIL = 'cyesil@gmail.com';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  lastSignIn: string | null;
  emailConfirmed: boolean;
  isPro: boolean;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminClient() {
  const router = useRouter();
  const locale = useLocale();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 3000);
  };

  const getToken = () => localStorage.getItem('cvita_token') || '';

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: 'Bearer ' + getToken() },
      });
      if (res.status === 403) { router.push(`/${locale}/dashboard`); return; }
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      showToast('Failed to load users', 'error');
    } finally { setLoading(false); }
  }, [locale, router]);

  useEffect(() => {
    const user = (() => { try { return JSON.parse(localStorage.getItem('cvita_user') || '{}'); } catch { return {}; } })();
    if (user.email !== ADMIN_EMAIL) { router.push(`/${locale}/dashboard`); return; }
    loadUsers();
  }, [loadUsers, locale, router]);

  async function togglePlan(user: AdminUser) {
    setActionLoading(user.id + '_plan');
    try {
      const res = await fetch('/api/admin/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({ userId: user.id, isPro: !user.isPro }),
      });
      if (!res.ok) throw new Error('Failed');
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isPro: !u.isPro } : u));
      showToast(`${user.email} → ${!user.isPro ? 'Pro ✓' : 'Free'}`, 'success');
    } catch { showToast('Failed to update plan', 'error'); }
    finally { setActionLoading(null); }
  }

  async function resetPassword(user: AdminUser) {
    if (!confirm(`Send password reset email to ${user.email}?`)) return;
    setActionLoading(user.id + '_reset');
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({ email: user.email }),
      });
      if (!res.ok) throw new Error('Failed');
      showToast(`Reset email sent to ${user.email}`, 'success');
    } catch { showToast('Failed to send reset email', 'error'); }
    finally { setActionLoading(null); }
  }

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(search.toLowerCase())
  );

  const proCount = users.filter(u => u.isPro).length;
  const confirmedCount = users.filter(u => u.emailConfirmed).length;

  return (
    <main className={styles.main}>
      <div className={styles.topbar}>
        <div>
          <div className={styles.topbarTitle}>⚙️ Admin Panel</div>
          <div className={styles.topbarSub}>CVzume user management</div>
        </div>
        <button className={styles.refreshBtn} onClick={loadUsers}>↺ Refresh</button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{users.length}</div>
          <div className={styles.statLabel}>Total Users</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: '#F59E0B' }}>{proCount}</div>
          <div className={styles.statLabel}>Pro Users</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: '#22C55E' }}>{users.length - proCount}</div>
          <div className={styles.statLabel}>Free Users</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: '#1A56DB' }}>{confirmedCount}</div>
          <div className={styles.statLabel}>Email Confirmed</div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <input
            className={styles.searchInput}
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className={styles.resultCount}>{filtered.length} users</span>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading users…</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Last login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.avatar}>
                          {((u.firstName?.[0] || '') + (u.lastName?.[0] || '')).toUpperCase() || u.email?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span>{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td className={styles.emailCell}>{u.email}</td>
                    <td>
                      <span className={`${styles.planBadge} ${u.isPro ? styles.planPro : styles.planFree}`}>
                        {u.isPro ? '⚡ Pro' : 'Free'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${u.emailConfirmed ? styles.statusConfirmed : styles.statusPending}`}>
                        {u.emailConfirmed ? '✓ Confirmed' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className={styles.dateCell}>{formatDate(u.createdAt)}</td>
                    <td className={styles.dateCell}>{formatDate(u.lastSignIn)}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={`${styles.actionBtn} ${u.isPro ? styles.actionDemote : styles.actionPromote}`}
                          onClick={() => togglePlan(u)}
                          disabled={actionLoading === u.id + '_plan'}
                          title={u.isPro ? 'Downgrade to Free' : 'Upgrade to Pro'}
                        >
                          {actionLoading === u.id + '_plan' ? '…' : u.isPro ? '↓ Free' : '↑ Pro'}
                        </button>
                        <button
                          className={styles.actionBtnReset}
                          onClick={() => resetPassword(u)}
                          disabled={actionLoading === u.id + '_reset'}
                          title="Send password reset email"
                        >
                          {actionLoading === u.id + '_reset' ? '…' : '🔑 Reset'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''} ${toastType === 'error' ? styles.toastError : styles.toastSuccess}`}>
        {toast}
      </div>
    </main>
  );
}
