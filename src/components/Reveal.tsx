'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface RevealProps {
  children: React.ReactNode;
  /** seconds; use for stagger between siblings */
  delay?: number;
  /** slide direction; 'none' = pure fade */
  from?: 'up' | 'left' | 'right' | 'none';
  className?: string;
}

/**
 * Fades content in when it enters the viewport (once). Honors reduced motion.
 * If the page loads in a hidden tab (background tab, prerender, headless),
 * content renders visible immediately — it must never stay blank waiting for
 * an IntersectionObserver that suspended tabs don't fire.
 */
export default function Reveal({ children, delay = 0, from = 'up', className }: RevealProps) {
  const reduced = useReducedMotion();
  const [startedHidden] = useState(
    () => typeof document !== 'undefined' && document.visibilityState === 'hidden'
  );
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // Suspended tabs never run rAF, so a motion animation can't clear the
  // SSR-inlined hidden style — swap to a plain, fully-visible div instead.
  if (hydrated && startedHidden) {
    return <div className={className}>{children}</div>;
  }

  const offset =
    from === 'up' ? { y: 28 } : from === 'left' ? { x: -28 } : from === 'right' ? { x: 28 } : {};

  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
