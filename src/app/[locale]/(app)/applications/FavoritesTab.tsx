'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './applications.module.css';
import { Job, formatDeadline } from './types';

export default function FavoritesTab({ favorites, onToggleFavorite, t }: {
  favorites: Job[];
  onToggleFavorite: (job: Job) => void;
  t: (key: string) => string;
}) {
  const locale = useLocale();
  const router = useRouter();

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    matchScore: number; cvSummary: string; coverLetter: string;
    keyRequirements: string[]; tips: string[];
  } | null>(null);
  const [step, setStep] = useState<'list' | 'nocv' | 'analyze' | 'result' | 'sent'>('list');

  function checkCVAndStart(job: Job) {
    const profile = JSON.parse(localStorage.getItem('cvita_profile') || '{}');
    const cvExists = !!(profile.firstName || profile.summary || profile.experiences?.length > 0);
    setSelectedJob(job);
    setAnalysisResult(null);
    setStep(cvExists ? 'analyze' : 'nocv');
  }

  async function runAnalysis() {
    if (!selectedJob) return;
    setAnalyzing(true);
    const profile = JSON.parse(localStorage.getItem('cvita_profile') || '{}');
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobAd: selectedJob.description?.text || selectedJob.headline,
          userProfile: profile,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fel');
      localStorage.setItem('cvita_last_result', JSON.stringify({
        role: selectedJob.headline,
        employer: selectedJob.employer?.name || '',
        jobAd: selectedJob.description?.text || '',
        ...data,
      }));
      setAnalysisResult(data);
      setStep('result');
    } catch {
      alert('Något gick fel vid analysen. Försök igen.');
    } finally {
      setAnalyzing(false);
    }
  }

  if (step === 'sent') {
    return (
      <div className={styles.stepCard}>
        <div className={styles.stepIcon}>🎉</div>
        <div className={styles.stepTitle}>Ansökan skickad!</div>
        <p className={styles.stepDesc}>
          <strong>{selectedJob?.headline}</strong> har lagts till under <strong>Skickade ansökningar</strong>. Du hittar den i menyn under Ansökningar.
        </p>
        <div className={styles.stepActions}>
          <button className={styles.stepBtnSecondary} onClick={() => setStep('list')}>← Tillbaka till favoriter</button>
          <button className={styles.stepBtnPrimary} onClick={() => router.push(`/${locale}/skickade`)}>Se mina ansökningar →</button>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className={styles.favEmpty}>
        <div className={styles.favEmptyIcon}>★</div>
        <div className={styles.favEmptyTitle}>Inga sparade jobb än</div>
        <div className={styles.favEmptySub}>Sök jobb och klicka på ★ för att spara dem här.</div>
      </div>
    );
  }

  if (step === 'nocv') {
    return (
      <div className={styles.stepCard}>
        <div className={styles.stepIcon}>📄</div>
        <div className={styles.stepTitle}>Du behöver ett CV först</div>
        <p className={styles.stepDesc}>
          För att anpassa ditt CV till <strong>{selectedJob?.headline}</strong> behöver du fylla i din profil. Det tar bara några minuter.
        </p>
        <div className={styles.stepActions}>
          <button className={styles.stepBtnSecondary} onClick={() => setStep('list')}>← Tillbaka</button>
          <button className={styles.stepBtnPrimary} onClick={() => router.push(`/${locale}/profile`)}>Skapa mitt CV →</button>
        </div>
      </div>
    );
  }

  if (step === 'analyze') {
    return (
      <div className={styles.stepCard}>
        <div className={styles.stepIcon}>🎯</div>
        <div className={styles.stepTitle}>Anpassa ditt CV till jobbet</div>
        <p className={styles.stepDesc}>
          AI:n analyserar annonsen för <strong>{selectedJob?.headline}</strong> och ger konkreta förslag på hur du förbättrar ditt CV för just det här jobbet — t.ex. vilka nyckelord du bör använda.
        </p>
        <div className={styles.jobPreview}>
          <div className={styles.jobPreviewTitle}>{selectedJob?.headline}</div>
          {selectedJob?.employer?.name && <div className={styles.jobPreviewEmployer}>{selectedJob.employer.name}</div>}
        </div>
        <div className={styles.stepActions}>
          <button className={styles.stepBtnSecondary} onClick={() => setStep('list')}>← Tillbaka</button>
          <button className={styles.stepBtnPrimary} onClick={runAnalysis} disabled={analyzing}>
            {analyzing ? '⏳ Analyserar...' : '✨ Analysera & anpassa CV →'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'result' && analysisResult) {
    return (
      <div className={styles.resultCard}>
        <div className={styles.resultCardHeader}>
          <div>
            <div className={styles.resultCardTitle}>{selectedJob?.headline}</div>
            {selectedJob?.employer?.name && <div className={styles.resultCardSub}>{selectedJob.employer.name}</div>}
          </div>
          <span className={styles.matchBadge}>{analysisResult.matchScore}% match</span>
        </div>

        <div className={styles.resultSection}>
          <div className={styles.resultSectionTitle}>🎯 Nyckelord från annonsen</div>
          <div className={styles.tagRow}>
            {analysisResult.keyRequirements?.map((r, i) => <span key={i} className={styles.tag}>{r}</span>)}
          </div>
        </div>

        <div className={styles.resultSection}>
          <div className={styles.resultSectionTitle}>📄 CV-förslag</div>
          <div className={styles.resultText}>{analysisResult.cvSummary}</div>
        </div>

        {analysisResult.tips?.length > 0 && (
          <div className={styles.resultSection}>
            <div className={styles.resultSectionTitle}>💡 Tips för ditt CV</div>
            {analysisResult.tips.map((tip, i) => <div key={i} className={styles.tipRow}>→ {tip}</div>)}
          </div>
        )}

        <div className={styles.stepActions}>
          <button className={styles.stepBtnSecondary} onClick={() => setStep('list')}>← Andra jobb</button>
          <button className={styles.stepBtnPrimary} onClick={() => {
            localStorage.setItem('cvita_cv_suggestions', JSON.stringify({
              role: selectedJob?.headline || '',
              employer: selectedJob?.employer?.name || '',
              keyRequirements: analysisResult.keyRequirements,
              cvSummary: analysisResult.cvSummary,
              tips: analysisResult.tips,
            }));
            router.push(`/${locale}/profile`);
          }}>Uppdatera CV →</button>
          <button className={styles.stepBtnPrimary} onClick={() => router.push(`/${locale}/letter`)}>Skriv personligt brev →</button>
          <button className={styles.stepBtnSend} onClick={async () => {
            if (selectedJob) onToggleFavorite(selectedJob); // remove from favorites
            const token = localStorage.getItem('cvita_token');
            if (token && selectedJob) {
              await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  access_token: token,
                  role: selectedJob.headline,
                  jobAd: selectedJob.description?.text || selectedJob.headline,
                  matchScore: analysisResult.matchScore,
                  cvSummary: analysisResult.cvSummary,
                  coverLetter: '',
                  keyRequirements: analysisResult.keyRequirements,
                  tips: analysisResult.tips,
                  provider: 'favorites',
                  status: 'sent',
                }),
              }).catch(() => {});
              fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, type: 'application', title: selectedJob.headline, subtitle: `${analysisResult.matchScore}% match` }),
              }).catch(() => {});
            }
            setStep('sent');
          }}>✅ Skicka ansökan</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.favHint}>
        <span>⭐</span>
        <span>Välj ett jobb för att anpassa ditt CV och skriva ett personligt brev.</span>
      </div>
      <div className={styles.favList}>
        {favorites.map(job => (
          <div key={job.id} className={styles.favItem}>
            <div className={styles.favItemInfo}>
              <div className={styles.favItemTitle}>{job.headline}</div>
              <div className={styles.favItemMeta}>
                {job.employer?.name && <span>{job.employer.name}</span>}
                {job.workplace_address?.municipality && <span>📍 {job.workplace_address.municipality}</span>}
                {job.application_deadline && <span>⏰ {formatDeadline(job.application_deadline)}</span>}
              </div>
            </div>
            <div className={styles.favItemActions}>
              <button className={styles.stepBtnSecondary} onClick={() => onToggleFavorite(job)}>Ta bort</button>
              {job.webpage_url && (
                <a href={job.webpage_url} target="_blank" rel="noopener noreferrer" className={styles.favLinkBtn}>Visa annons →</a>
              )}
              <button className={styles.stepBtnPrimary} onClick={() => checkCVAndStart(job)}>✨ Starta ansökan →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
