'use client';

// PDF dışa aktarma görünümü: body'ye portal, ekranda gizli; yazdırırken (window.print) tek görünen şey.
// Stiller ny.module.css'teki @media print kurallarında. "Ny ansökan" ve "Mina ansökningar" kullanır.
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import styles from './ny.module.css';
import { descLines, period, type ExportCv, type ExportPerson, type LetterMeta } from '@/lib/export-docs';

export default function PrintDocument({ kind, person, cv, letter, footer, style, meta }: { kind: 'cv' | 'letter'; person: ExportPerson; cv?: ExportCv | null; letter?: string; footer?: string; style?: React.CSSProperties; meta?: LetterMeta }) {
  const t = useTranslations('ny');
  return createPortal(
    <div className={`${styles.printArea} cvzume-print`} style={style}>
      {kind === 'cv' ? (
        <div className={styles.pHead}>
          <div>
            <div className={styles.pName}>{person.name}</div>
            {person.title && <div className={styles.pTitle}>{person.title}</div>}
            <div className={styles.pContact}>{[person.email, person.phone, person.location].filter(Boolean).join('  ·  ')}</div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {person.photo && <img className={styles.pPhoto} src={person.photo} alt="" />}
        </div>
      ) : (
        // Mektup: ad normal büyüklükte, altında iletişim; sonra yer/tarih, alıcı ve konu satırı
        <div className={styles.lHead}>
          <div className={styles.lName}>{person.name}</div>
          <div className={styles.pContact}>{[person.location, person.phone, person.email].filter(Boolean).join('  ·  ')}</div>
        </div>
      )}
      {kind === 'cv' && cv ? (
        <>
          {cv.summary && (<><h3>{t('cv.profile')}</h3><p>{cv.summary}</p></>)}
          {cv.experiences.length > 0 && <h3>{t('cv.experience')}</h3>}
          {cv.experiences.map((e, i) => (
            <div key={i} className={styles.pExp}>
              <div><strong>{e.role}</strong>{e.company && ` — ${e.company}`}</div>
              <div className={styles.pPeriod}>{period(e.start, e.end, t('cv.present'))}</div>
              <ul>{descLines(e.desc).map(l => <li key={l}>{l}</li>)}</ul>
            </div>
          ))}
          {cv.educations.length > 0 && <h3>{t('cv.education')}</h3>}
          {cv.educations.map((e, i) => (
            <div key={i} className={styles.pEdu}><strong>{[e.degree, e.field].filter(Boolean).join(', ')}</strong>{e.school && ` — ${e.school}`} <span className={styles.pPeriod}>{e.years}</span></div>
          ))}
          {cv.skills.length > 0 && (<><h3>{t('cv.skills')}</h3><p>{cv.skills.join('  ·  ')}</p></>)}
          {cv.languages.length > 0 && (<><h3>{t('cv.languages')}</h3><p>{cv.languages.join('  ·  ')}</p></>)}
        </>
      ) : (
        <div className={styles.pLetter}>
          {meta?.date && <div className={styles.lDate}>{meta.date}</div>}
          {meta?.recipient && <div className={styles.lTo}>{meta.recipient}</div>}
          {meta?.subject && <div className={styles.lSubject}>{meta.subject}</div>}
          {(letter || '').split(/\n{2,}/).map((par, i) => <p key={i}>{par}</p>)}
        </div>
      )}
      {footer && <div className={styles.pFooter}>{footer}</div>}
    </div>,
    document.body,
  );
}
