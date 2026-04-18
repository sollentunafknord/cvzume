import { useState } from 'react';
import styles from './profile.module.css';

interface Suggestions {
  role: string;
  employer: string;
  keyRequirements: string[];
  cvSummary: string;
  tips: string[];
}

export default function CvSuggestionsBanner({ suggestions, onDismiss }: {
  suggestions: Suggestions;
  onDismiss: () => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className={styles.suggBanner}>
      <div className={styles.suggBannerHeader}>
        <div className={styles.suggBannerTitle}>
          🎯 AI-förslag för <strong>{suggestions.role}</strong>
          {suggestions.employer && <span className={styles.suggEmployer}> · {suggestions.employer}</span>}
        </div>
        <div className={styles.suggBannerActions}>
          <button className={styles.suggToggle} onClick={() => setOpen(o => !o)}>
            {open ? '▲ Dölj' : '▼ Visa'}
          </button>
          <button className={styles.suggDismiss} onClick={onDismiss}>✕</button>
        </div>
      </div>
      {open && (
        <div className={styles.suggBody}>
          <div className={styles.suggSection}>
            <div className={styles.suggSectionTitle}>Nyckelord att lägga till</div>
            <div className={styles.suggTags}>
              {suggestions.keyRequirements?.map((r, i) => <span key={i} className={styles.suggTag}>{r}</span>)}
            </div>
          </div>
          {suggestions.cvSummary && (
            <div className={styles.suggSection}>
              <div className={styles.suggSectionTitle}>Föreslaget CV-sammandrag</div>
              <div className={styles.suggText}>{suggestions.cvSummary}</div>
            </div>
          )}
          {suggestions.tips?.length > 0 && (
            <div className={styles.suggSection}>
              <div className={styles.suggSectionTitle}>Tips</div>
              {suggestions.tips.map((tip, i) => <div key={i} className={styles.suggTip}>→ {tip}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
