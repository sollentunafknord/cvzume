'use client';

import { useEffect, useState } from 'react';
import styles from './applications.module.css';

// Star pulses 5× → morphs to heart → heart pulses once → back to star → loops
export default function FavButton({ favorited, onClick }: {
  favorited: boolean;
  onClick: () => void;
}) {
  const [showHeart, setShowHeart] = useState(false);
  const [phase, setPhase] = useState<'star' | 'heart' | null>(null);

  useEffect(() => {
    if (favorited) {
      setShowHeart(false);
      setPhase('star');
    } else {
      setShowHeart(false);
      setPhase(null);
    }
  }, [favorited]);

  function handleAnimEnd() {
    if (phase === 'star') {
      // star done → switch to heart
      setShowHeart(true);
      setPhase('heart');
    } else if (phase === 'heart') {
      // heart done → back to star
      setShowHeart(false);
      setPhase('star');
    }
  }

  const cls =
    phase === 'star' ? styles.starPulse :
    phase === 'heart' ? styles.heartPulse : '';

  return (
    <button
      className={`${styles.favBtn} ${favorited ? styles.favActive : ''}`}
      onClick={onClick}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <span className={`${styles.favIcon} ${cls}`} onAnimationEnd={handleAnimEnd}>
        {showHeart ? '♥' : favorited ? '★' : '☆'}
      </span>
    </button>
  );
}
