'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('profile');
  const [open, setOpen] = useState(true);

  return (
    <div className={styles.suggBanner}>
      <div className={styles.suggBannerHeader}>
        <div className={styles.suggBannerTitle}>
          {t('banner_title')} <strong>{suggestions.role}</strong>
          {suggestions.employer && <span className={styles.suggEmployer}> · {suggestions.employer}</span>}
        </div>
        <div className={styles.suggBannerActions}>
          <button className={styles.suggToggle} onClick={() => setOpen(o => !o)}>
            {open ? t('banner_hide') : t('banner_show')}
          </button>
          <button className={styles.suggDismiss} onClick={onDismiss}>✕</button>
        </div>
      </div>
      {open && (
        <div className={styles.suggBody}>
          <div className={styles.suggSection}>
            <div className={styles.suggSectionTitle}>{t('banner_keywords')}</div>
            <div className={styles.suggTags}>
              {suggestions.keyRequirements?.map((r, i) => <span key={i} className={styles.suggTag}>{r}</span>)}
            </div>
          </div>
          {suggestions.cvSummary && (
            <div className={styles.suggSection}>
              <div className={styles.suggSectionTitle}>{t('banner_cv_summary')}</div>
              <div className={styles.suggText}>{suggestions.cvSummary}</div>
            </div>
          )}
          {suggestions.tips?.length > 0 && (
            <div className={styles.suggSection}>
              <div className={styles.suggSectionTitle}>{t('banner_tips')}</div>
              {suggestions.tips.map((tip, i) => <div key={i} className={styles.suggTip}>→ {tip}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
