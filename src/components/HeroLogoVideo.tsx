'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * The animated TechConnect logo in the hero.
 *
 * Two encodes are offered:
 *
 * 1. `logo-anim-alpha.webm` — VP9 with a real alpha channel, taken by every
 *    current browser. It composites normally, so the anti-aliased edge of the
 *    artwork blends correctly with the red gradient underneath.
 *
 * 2. `logo-anim.mp4` — H.264, no alpha, for anything that cannot decode VP9
 *    alpha. There the black background has to be knocked out with
 *    `mix-blend-mode: lighten`.
 *
 * The blend mode is applied ONLY to the fallback, because it is what caused the
 * green fringing: `lighten` takes the max of each RGB channel independently,
 * and the red backdrop's green channel is only about 55, so the grey
 * anti-aliasing pixels around the logo (~68 green) won it and painted a
 * desaturated rim. With a real alpha channel there is nothing to knock out.
 */
export default function HeroLogoVideo({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);
  // Assume the blend-mode fallback until we know which file actually loaded, so
  // a black box can never flash on top of the gradient.
  const [hasAlpha, setHasAlpha] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const detectSource = useCallback(() => {
    const v = ref.current;
    if (v?.currentSrc) setHasAlpha(v.currentSrc.includes('logo-anim-alpha'));
  }, []);

  useEffect(() => {
    detectSource();
  }, [detectSource]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    if (reduced) {
      v.pause();
      return;
    }
    // Autoplay can be refused on the first attempt, and a hidden tab will not
    // advance playback at all. Ask unconditionally (it is a harmless no-op when
    // hidden) and ask again whenever the tab comes back, so the logo can never
    // end up frozen on its poster frame.
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
    document.addEventListener('visibilitychange', tryPlay);
    return () => document.removeEventListener('visibilitychange', tryPlay);
  }, [reduced]);

  return (
    <video
      ref={ref}
      loop
      muted
      playsInline
      autoPlay={!reduced}
      preload="metadata"
      poster="/logo-anim-poster.webp"
      aria-label="Анимированный логотип TechConnect"
      onLoadedMetadata={detectSource}
      className={cn('pointer-events-none select-none', className)}
      style={hasAlpha ? undefined : { mixBlendMode: 'lighten' }}
    >
      <source src="/logo-anim-alpha.webm" type="video/webm" />
      <source src="/logo-anim.mp4" type="video/mp4" />
    </video>
  );
}
