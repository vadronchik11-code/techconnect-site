'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

interface CountUpProps {
  /** e.g. "600+", "15", "3" — number part animates, suffix stays */
  value: string;
  duration?: number;
}

/** Animates the numeric part of a stat from 0 when it scrolls into view. */
export default function CountUp({ value, duration = 1.4 }: CountUpProps) {
  const match = value.match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1], 10) : null;
  const suffix = match ? match[2] : '';

  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduced = useReducedMotion();
  // Hidden tabs suspend rAF/IntersectionObserver — show the final value at once.
  const [startedHidden] = useState(
    () => typeof document !== 'undefined' && document.visibilityState === 'hidden'
  );
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (target === null) return;
    if (startedHidden) {
      setDisplay(target);
      return;
    }
    if (!inView) return;
    if (reduced) {
      setDisplay(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - t, 4); // ease-out-quart
      setDisplay(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration, reduced, startedHidden]);

  // Non-numeric values render as-is.
  if (target === null) return <span>{value}</span>;

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}
