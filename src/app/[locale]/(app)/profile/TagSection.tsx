import { useState } from 'react';
import styles from './profile.module.css';

export default function TagSection({ icon, iconColor, title, subtitle, items, placeholder, open, onToggle, onAdd, onRemove }: {
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  items: string[];
  placeholder: string;
  open: boolean;
  onToggle: () => void;
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
}) {
  const [input, setInput] = useState('');

  function add() {
    const v = input.trim();
    if (v) { onAdd(v); setInput(''); }
  }

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHead} onClick={onToggle}>
        <div className={styles.sectionHeadLeft}>
          <div className={`${styles.sectionIcon} ${iconColor}`}>{icon}</div>
          <div>
            <div className={styles.sectionHeadTitle}>{title}</div>
            <div className={styles.sectionHeadSub}>{subtitle}</div>
          </div>
        </div>
        <span className={styles.sectionToggle}>{open ? '▼' : '▶'}</span>
      </div>
      {open && (
        <div className={styles.sectionBody}>
          <div className={styles.tagsWrap}>
            {items.map((item, i) => (
              <span key={i} className={styles.tag}>
                {item}
                <button className={styles.tagRemove} onClick={() => onRemove(i)}>✕</button>
              </span>
            ))}
          </div>
          <div className={styles.tagInputRow}>
            <input
              className={`${styles.formInput} ${styles.tagInput}`}
              placeholder={placeholder}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            />
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={add}>＋ Lägg till</button>
          </div>
        </div>
      )}
    </div>
  );
}
