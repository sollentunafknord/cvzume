'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './applications.module.css';

// Star pulses 5× like a heartbeat → morphs to heart → heart pulses once → back to star → repeat
export default function FavButton({ favorited, onClick }: {
  favorited: boolean;
  onClick: () => void;
}) {
  const [icon, setIcon] = useState<'star' | 'heart'>('star');
  const [animClass, setAnimClass] = useState('');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  useEffect(() => {
    if (!favorited) {
      clearTimers();
      setIcon('star');
      setAnimClass('');
      return;
    }

    let active = true;

    function loop() {
      if (!active) return;

      // Phase 1: star pulses 5×  (5 × 320ms = 1600ms)
      setIcon('star');
      setAnimClass(styles.starPulse);

      const t1 = setTimeout(() => {
        if (!active) return;
        setAnimClass('');
        setIcon('heart');

        // Phase 2: heart appears, then pulses once (700ms)
        const t2 = setTimeout(() => {
          if (!active) return;
          setAnimClass(styles.heartPulse);

          const t3 = setTimeout(() => {
            if (!active) return;
            setAnimClass('');
            setIcon('star');

            // brief pause before next loop
            const t4 = setTimeout(loop, 400);
            timers.current.push(t4);
          }, 700);
          timers.current.push(t3);
        }, 60);
        timers.current.push(t2);
      }, 1600);
      timers.current.push(t1);
    }

    loop();

    return () => {
      active = false;
      clearTimers();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorited]);

  return (
    <button
      className={`${styles.favBtn} ${favorited ? styles.favActive : ''}`}
      onClick={onClick}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <span className={`${styles.favIcon} ${animClass}`}>
        {icon === 'heart' ? '♥' : favorited ? '★' : '☆'}
      </span>
    </button>
  );
}
