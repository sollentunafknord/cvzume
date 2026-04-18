import styles from './applications.module.css';
import { Job, formatDeadline } from './types';

export default function JobCard({ job, favorited, onToggleFavorite, t }: {
  job: Job;
  favorited: boolean;
  onToggleFavorite: (job: Job) => void;
  t: (key: string) => string;
}) {
  const deadline = formatDeadline(job.application_deadline);
  return (
    <div className={styles.jobCard}>
      <div className={styles.jobCardHeader}>
        <div className={styles.jobInfo}>
          <h3 className={styles.jobTitle}>{job.headline}</h3>
          <div className={styles.jobMeta}>
            {job.employer?.name && <span className={styles.employer}>{job.employer.name}</span>}
            {(job.workplace_address?.municipality || job.workplace_address?.region) && (
              <span className={styles.location}>📍 {job.workplace_address.municipality || job.workplace_address.region}</span>
            )}
            {deadline && <span className={styles.deadline}>⏰ {t('deadline')}: {deadline}</span>}
          </div>
        </div>
        <button
          className={`${styles.favBtn} ${favorited ? styles.favActive : ''}`}
          onClick={() => onToggleFavorite(job)}
        >
          {favorited ? '★' : '☆'}
        </button>
      </div>
      {job.description?.text && (
        <p className={styles.jobDesc}>{job.description.text.replace(/<[^>]+>/g, '').slice(0, 200)}…</p>
      )}
      <div className={styles.jobActions}>
        {job.webpage_url && (
          <a href={job.webpage_url} target="_blank" rel="noopener noreferrer" className={styles.applyLink}>
            {t('apply_btn')}
          </a>
        )}
      </div>
    </div>
  );
}
