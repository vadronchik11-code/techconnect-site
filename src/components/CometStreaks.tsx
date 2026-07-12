import { cn } from '@/lib/utils';

/**
 * Brand "comet" streaks — the diagonal rounded dashes from the TechConnect
 * design system (banners / шапка). Pure decorative SVG, deterministic per seed.
 */

type Tone = 'flame' | 'cream' | 'dark';

// Colors are picked per background: `flame` sits on red fills, `cream` on
// white/cream sections, `dark` on the deep-crimson footer.
const TONES: Record<Tone, string[]> = {
  flame: [
    'rgba(255,235,207,0.85)',
    'rgba(255,235,207,0.4)',
    'rgba(168,19,19,0.5)',
    'rgba(255,255,255,0.28)',
  ],
  cream: ['rgba(255,81,28,0.16)', 'rgba(168,19,19,0.10)', 'rgba(246,204,178,0.55)'],
  dark: ['rgba(255,235,207,0.2)', 'rgba(255,81,28,0.45)', 'rgba(0,0,0,0.16)'],
};

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface CometStreaksProps {
  tone?: Tone;
  /** number of streaks */
  density?: number;
  /** change to get a different arrangement */
  seed?: number;
  /** slow diagonal drift (disabled automatically by prefers-reduced-motion) */
  drift?: boolean;
  className?: string;
}

export default function CometStreaks({
  tone = 'flame',
  density = 26,
  seed = 7,
  drift = true,
  className,
}: CometStreaksProps) {
  const rand = mulberry32(seed);
  const colors = TONES[tone];
  const streaks = Array.from({ length: density }, () => ({
    x: rand() * 1500 - 150,
    y: rand() * 1100 - 150,
    len: 70 + rand() * 300,
    w: 9 + rand() * 17,
    c: colors[Math.floor(rand() * colors.length)],
  }));

  return (
    <svg
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
    >
      <g transform="rotate(-38 600 400)">
        <g className={drift ? 'tc-drift' : undefined}>
          {streaks.map((s, i) => (
            <line
              key={i}
              x1={s.x}
              y1={s.y}
              x2={s.x + s.len}
              y2={s.y}
              stroke={s.c}
              strokeWidth={s.w}
              strokeLinecap="round"
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
