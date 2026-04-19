'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './intervju.module.css';

interface Application {
  id: string;
  role: string;
  match_score: number;
  status: string;
  created_at: string;
}

interface InterviewQuestion {
  category: string;
  question: string;
  tip: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
}

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  Teknisk:  { bg: '#EFF6FF', color: '#1A56DB' },
  Beteende: { bg: '#F0FDF4', color: '#16A34A' },
  Situation:{ bg: '#FFF7ED', color: '#C2410C' },
  Personlig:{ bg: '#FDF4FF', color: '#9333EA' },
  Företag:  { bg: '#FFFBEB', color: '#D97706' },
};

export default function IntervjuClient({ onNavigate }: { onNavigate?: (seg: string) => void }) {
  const locale = useLocale();
  const router = useRouter();

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  function goTo(seg: string) {
    if (onNavigate) onNavigate(seg);
    else router.push(`/${locale}/${seg}`);
  }

  const load = useCallback(async () => {
    const token = localStorage.getItem('cvita_token');
    if (!token) { router.push(`/${locale}/auth`); return; }
    try {
      const res = await fetch(`/api/applications?token=${token}`);
      const data = await res.json();
      const interview = (data.applications || []).filter((a: Application) => a.status === 'interview');
      setApps(interview);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [locale, router]);

  useEffect(() => { load(); }, [load]);

  async function generateQuestions(app: Application) {
    setSelectedApp(app);
    setQuestions([]);
    setExpanded(null);
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: app.role }),
      });
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch {
      setQuestions([]);
    } finally {
      setGenerating(false);
    }
  }

  async function patchApp(id: string, status: string) {
    const token = localStorage.getItem('cvita_token');
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status }),
    });
    setApps(prev => prev.filter(a => a.id !== id));
    if (selectedApp?.id === id) setSelectedApp(null);
  }

  async function deleteApp(id: string, role: string) {
    if (!confirm(`Ta bort "${role}"? Det går inte att ångra.`)) return;
    const token = localStorage.getItem('cvita_token');
    await fetch('/api/applications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    setApps(prev => prev.filter(a => a.id !== id));
    if (selectedApp?.id === id) { setSelectedApp(null); setQuestions([]); }
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Intervju förberedelse</h1>
        <p className={styles.subtitle}>
          {apps.length} {apps.length === 1 ? 'jobb' : 'jobb'} · Klicka på ett jobb för att generera AI-intervjufrågor
        </p>
      </div>

      {loading && <div className={styles.loading}>Laddar...</div>}

      {!loading && apps.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎯</div>
          <div className={styles.emptyTitle}>Inga intervjuer än</div>
          <div className={styles.emptySub}>
            När du markerar "Positiv svar" på en ansökan i{' '}
            <button className={styles.emptyLink} onClick={() => goTo('skickade')}>Skickade ansökningar</button>{' '}
            hamnar den här.
          </div>
        </div>
      )}

      {!loading && apps.length > 0 && (
        <div className={styles.layout}>
          <div className={styles.appList}>
            {apps.map(app => (
              <div
                key={app.id}
                className={`${styles.appCard} ${selectedApp?.id === app.id ? styles.appCardActive : ''}`}
                onClick={() => generateQuestions(app)}
              >
                <div className={styles.appInfo}>
                  <div className={styles.appRole}>{app.role}</div>
                  <div className={styles.appMeta}>Kallad {formatDate(app.created_at)}</div>
                </div>
                <div className={styles.appCardActions}>
                  <button
                    className={styles.backBtn}
                    title="Tillbaka till skickade"
                    onClick={e => { e.stopPropagation(); patchApp(app.id, 'sent'); }}
                  >↩</button>
                  <button
                    className={styles.deleteBtn}
                    title="Ta bort"
                    onClick={e => { e.stopPropagation(); deleteApp(app.id, app.role); }}
                  >🗑️</button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.questionsPanel}>
            {!selectedApp && (
              <div className={styles.panelPlaceholder}>
                <div className={styles.placeholderIcon}>💬</div>
                <div className={styles.placeholderText}>Välj ett jobb för att generera intervjufrågor</div>
              </div>
            )}

            {selectedApp && generating && (
              <div className={styles.generating}>
                <div className={styles.generatingSpinner} />
                <div className={styles.generatingText}>Genererar intervjufrågor för {selectedApp.role}...</div>
              </div>
            )}

            {selectedApp && !generating && questions.length > 0 && (
              <>
                <div className={styles.questionsHeader}>
                  <div className={styles.questionsTitle}>Intervjufrågor — {selectedApp.role}</div>
                  <div className={styles.questionsCount}>{questions.length} frågor</div>
                </div>
                <div className={styles.questionsList}>
                  {questions.map((q, i) => {
                    const colors = CATEGORY_COLORS[q.category] || { bg: '#F1F5F9', color: '#475569' };
                    return (
                      <div key={i} className={styles.questionItem}>
                        <div
                          className={styles.questionHeader}
                          onClick={() => setExpanded(expanded === i ? null : i)}
                        >
                          <div className={styles.questionLeft}>
                            <span className={styles.questionNum}>{i + 1}</span>
                            <span
                              className={styles.categoryBadge}
                              style={{ background: colors.bg, color: colors.color }}
                            >
                              {q.category}
                            </span>
                            <span className={styles.questionText}>{q.question}</span>
                          </div>
                          <span className={styles.expandIcon}>{expanded === i ? '▲' : '▼'}</span>
                        </div>
                        {expanded === i && q.tip && (
                          <div className={styles.questionTip}>
                            <span className={styles.tipIcon}>💡</span>
                            {q.tip}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button
                  className={styles.regenerateBtn}
                  onClick={() => generateQuestions(selectedApp)}
                >
                  ↻ Generera nya frågor
                </button>
              </>
            )}

            {selectedApp && !generating && questions.length === 0 && (
              <div className={styles.panelPlaceholder}>
                <div className={styles.placeholderText}>Kunde inte generera frågor. Försök igen.</div>
                <button className={styles.regenerateBtn} onClick={() => generateQuestions(selectedApp)}>
                  Försök igen
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
