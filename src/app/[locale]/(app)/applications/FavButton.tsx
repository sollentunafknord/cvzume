'use client';

import { useState } from 'react';
import styles from './applications.module.css';

// Always-on animation: star pulses 5× → becomes heart → heart pulses once → back to star → loops
export default function FavButton({ favorited, onClick }: {
  favorited: boolean;
  onClick: () => void;
}) {
  const [showHeart, setShowHeart] = useState(false);
  const [phase, setPhase] = useState<'star' | 'heart'>('star');

  function handleAnimEnd() {
    if (phase === 'star') {
      setShowHeart(true);
      setPhase('heart');
    } else {
      setShowHeart(false);
      setPhase('star');
    }
  }

  return (
    <button
      className={`${styles.favBtn} ${favorited ? styles.favActive : ''}`}
      onClick={onClick}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <span
        className={`${styles.favIcon} ${phase === 'star' ? styles.starPulse : styles.heartPulse}`}
        onAnimationEnd={handleAnimEnd}
      >
        {showHeart ? '♥' : favorited ? '★' : '☆'}
      </span>
    </button>
  );
}
