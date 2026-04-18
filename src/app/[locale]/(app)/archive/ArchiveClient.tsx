'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

interface Application {
  id: string;
  role: string;
  match_score: number;
  status: string;
  created_at: string;
}

interface LocalApp {
  id: string;
  role: string;
  employer: string;
  matchScore: number;
  appliedAt: string;
  status: 'applied' | 'done';
}

function ScoreBadge({ score }: { score: number }) {
  const bg = score >= 80 ? '#DCFCE7' : score >= 60 ? '#FEF9C3' : '#FEE2E2';
  const color = score >= 80 ? '#15803D' : score >= 60 ? '#854D0E' : '#991B1B';
  return <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: bg, color }}>{score}% match</span>;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
}

const card: React.CSSProperties = { background: 'white', border: '1.5px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 };
const iconBox: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 };
const actionBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15, border: '1.5px solid var(--border)', background: 'white' };

export default function ArchiveClient() {
  const locale = useLocale();
  const router = useRouter();

  const [localApps, setLocalApps] = useState<LocalApp[]>([]);
  const [archivedApps, setArchivedApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  }
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const load = useCallback(async () => {
    const saved = localStorage.getItem('cvita_user');
    if (!saved) { router.push(`/${locale}/auth`); return; }
    const user = JSON.parse(saved);
    const token = localStorage.getItem('cvita_token');
    if (!token) { router.push(`/${locale}/auth`); return; }

    // Load local tracked applications
    const raw: LocalApp[] = JSON.parse(localStorage.getItem('cvita_my_applications') || '[]');
    setLocalApps(raw);

    // Load archived from API
    try {
      const res = await fetch(`/api/applications?token=${token}`);
      const data = await res.json();
      setArchivedApps((data.applications || []).filter((a: Application) => a.status === 'archived'));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [locale, router]);

  useEffect(() => { load(); }, [load]);

  function markDone(id: string) {
    const updated = localApps.map(a => a.id === id ? { ...a, status: 'done' as const } : a);
    setLocalApps(updated);
    localStorage.setItem('cvita_my_applications', JSON.stringify(updated));
    showToast('✅ Markerad som avslutad!');
  }

  function removeLocal(id: string) {
    const updated = localApps.filter(a => a.id !== id);
    setLocalApps(updated);
    localStorage.setItem('cvita_my_applications', JSON.stringify(updated));
    showToast('🗑️ Borttagen');
  }

  async function restoreApp(id: string) {
    const token = localStorage.getItem('cvita_token');
    try {
      await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status: 'draft' }),
      });
      setArchivedApps(prev => prev.filter(a => a.id !== id));
      showToast('✅ Ansökan återställd!');
    } catch { showToast('Kunde inte återställa'); }
  }

  async function deleteApp(id: string, role: string) {
    if (!confirm(`Delete "${role}"? This cannot be undone.`)) return;
    const token = localStorage.getItem('cvita_token');
    try {
      await fetch('/api/applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      setArchivedApps(prev => prev.filter(a => a.id !== id));
      showToast('🗑️ Ansökan borttagen');
    } catch { showToast('Kunde inte ta bort'); }
  }

  const sentApps = localApps.filter(a => a.status === 'applied');
  const doneApps = localApps.filter(a => a.status === 'done');

  const sectionTitle: React.CSSProperties = { fontFamily: "'DM Serif Display', serif", fontSize: 20, color: 'var(--navy)', marginBottom: 6 };
  const sectionSub: React.CSSProperties = { fontSize: 13, color: 'var(--muted)', marginBottom: 16 };

  return (
    <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', minHeight: '100vh', gap: 40 }}>

      <div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: 'var(--navy)', marginBottom: 6 }}>Ansökningar</div>
        <div style={{ fontSize: 14, color: 'var(--muted)' }}>Dina skickade och avslutade ansökningar</div>
      </div>

      {loading && <div style={{ color: 'var(--muted)', fontSize: 14 }}>Laddar...</div>}

      {/* ── SKICKADE ANSÖKNINGAR ── */}
      {!loading && (
        <div>
          <div style={sectionTitle}>📤 Skickade ansökningar</div>
          <div style={sectionSub}>{sentApps.length} pågående · Markera som avslutad när du fått svar</div>

          {sentApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: 12, border: '1.5px solid var(--border)', color: 'var(--muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Inga skickade ansökningar ännu</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Gå till Sök jobb → Favoriter → Skicka ansökan</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sentApps.map(app => (
                <div key={app.id} style={card}>
                  <div style={iconBox}>📤</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.role}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                      {app.employer && <span>{app.employer} · </span>}Skickad {formatDate(app.appliedAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <ScoreBadge score={app.matchScore} />
                    <button onClick={() => markDone(app.id)} title="Fick svar — markera som avslutad" style={{ ...actionBtn, background: '#F0FDF4', borderColor: '#86EFAC', color: '#15803D', fontSize: 13, padding: '0 12px', width: 'auto', whiteSpace: 'nowrap' }}>
                      ✓ Fick svar
                    </button>
                    <button onClick={() => removeLocal(app.id)} title="Ta bort" style={{ ...actionBtn, color: '#EF4444' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── AVSLUTADE ── */}
      {!loading && (
        <div>
          <div style={sectionTitle}>📁 Avslutade ansökningar</div>
          <div style={sectionSub}>{doneApps.length + archivedApps.length} avslutade</div>

          {doneApps.length === 0 && archivedApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: 12, border: '1.5px solid var(--border)', color: 'var(--muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 14 }}>Inga avslutade ansökningar ännu</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {doneApps.map(app => (
                <div key={app.id} style={card}>
                  <div style={iconBox}>✅</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.role}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                      {app.employer && <span>{app.employer} · </span>}Avslutad
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <ScoreBadge score={app.matchScore} />
                    <button onClick={() => removeLocal(app.id)} title="Ta bort" style={{ ...actionBtn, color: '#EF4444' }}>🗑️</button>
                  </div>
                </div>
              ))}
              {archivedApps.map(app => (
                <div key={app.id} style={card}>
                  <div style={iconBox}>📁</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.role || 'Okänd roll'}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Arkiverad · {formatDate(app.created_at)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <ScoreBadge score={app.match_score || 0} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => restoreApp(app.id)} title="Återställ" style={actionBtn}>↩️</button>
                      <button onClick={() => deleteApp(app.id, app.role)} title="Ta bort permanent" style={{ ...actionBtn, color: '#EF4444' }}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--navy)', color: 'white', padding: '14px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, zIndex: 999, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}
    </main>
  );
}
