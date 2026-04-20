'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import styles from './admin.module.css';

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  title: string | null;
  created_at: string;
  last_sign_in: string | null;
  isPro: boolean;
  plan_interval: string | null;
  stripe_sub_id: string | null;
  confirmed: boolean;
  provider: string;
}

interface Stats {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  newThisMonth: number;
  monthlyPro: number;
  yearlyPro: number;
  mrr: number;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminClient() {
  const locale = useLocale();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 3500);
  };

  const getToken = () => localStorage.getItem('cvita_token') || '';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin', {
        headers: { Authorization: 'Bearer ' + getToken() },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Error ${res.status}`);
        return;
      }
      setUsers(data.users || []);
      setStats(data.stats || null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function togglePlan(user: AdminUser) {
    setActionLoading(user.id + '_plan');
    try {
      const action = user.isPro ? 'remove_pro' : 'give_pro';
      const body: Record<string, string> = { action, userId: user.id, email: user.email || '' };
      if (user.isPro && user.stripe_sub_id) body.subId = user.stripe_sub_id;

      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed');
      }
      showToast(`${user.email} → ${user.isPro ? 'Free' : 'Pro ⚡'}`, 'success');
      await loadData();
    } catch (e: unknown) {
      showToast('❌ ' + (e instanceof Error ? e.message : 'Failed'), 'error');
    } finally {
      setActionLoading(null);
    }
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
      showToast(`Reset email sent → ${user.email}`, 'success');
    } catch {
      showToast('❌ Failed to send reset email', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = users.filter(u =>
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.first_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.last_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (error) {
    return (
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.topbarTitle}>⚙️ Admin Panel</div>
        </div>
        <div className={styles.errorBox}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Access error</div>
          <div style={{ color: 'var(--slate)', fontSize: 14 }}>{error}</div>
          <button className={styles.refreshBtn} style={{ marginTop: 16 }} onClick={loadData}>Try again</button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.topbar}>
        <div>
          <div className={styles.topbarTitle}>⚙️ Admin Panel</div>
          <div className={styles.topbarSub}>CVzume user management · {locale.toUpperCase()}</div>
        </div>
        <button className={styles.refreshBtn} onClick={loadData}>↺ Refresh</button>
      </div>

      {stats && (
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.totalUsers}</div>
            <div className={styles.statLabel}>Total Users</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue} style={{ color: '#F59E0B' }}>{stats.proUsers}</div>
            <div className={styles.statLabel}>Pro Users</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue} style={{ color: '#22C55E' }}>{stats.freeUsers}</div>
            <div className={styles.statLabel}>Free Users</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue} style={{ color: '#1A56DB' }}>{stats.newThisMonth}</div>
            <div className={styles.statLabel}>New This Month</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue} style={{ color: '#059669' }}>{stats.mrr} kr</div>
            <div className={styles.statLabel}>Est. MRR</div>
          </div>
        </div>
      )}

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
                        {u.avatar_url
                          ? <img src={u.avatar_url} alt="" className={styles.avatarImg} />
                          : <div className={styles.avatar}>
                              {((u.first_name?.[0] || '') + (u.last_name?.[0] || '')).toUpperCase() || u.email?.[0]?.toUpperCase() || '?'}
                            </div>
                        }
                        <span>{u.first_name} {u.last_name}</span>
                      </div>
                    </td>
                    <td className={styles.emailCell}>{u.email}</td>
                    <td>
                      <span className={`${styles.planBadge} ${u.isPro ? styles.planPro : styles.planFree}`}>
                        {u.isPro ? `⚡ Pro${u.plan_interval ? ' / ' + u.plan_interval : ''}` : 'Free'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${u.confirmed ? styles.statusConfirmed : styles.statusPending}`}>
                        {u.confirmed ? '✓ Confirmed' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className={styles.dateCell}>{formatDate(u.created_at)}</td>
                    <td className={styles.dateCell}>{formatDate(u.last_sign_in)}</td>
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
