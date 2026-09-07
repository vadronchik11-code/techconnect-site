import Link from 'next/link';
import HeroLogoVideo from './HeroLogoVideo';
import CometStreaks from './CometStreaks';
import CountUp from './CountUp';
import FollowNews from './FollowNews';
import Plate from './Plate';
import { SITE } from '@/lib/constants';

interface HeroProps {
  stats: { events: string; participants: string; partners: string };
}

/**
 * Soft hole punched in the drifting streak layer so the streaks stop crossing
 * the logo. Both the size and the position are derived from the same variables
 * that place the video, so the hole tracks the logo at every breakpoint.
 */
const HOLE =
  'radial-gradient(ellipse calc(var(--hero-logo) * 0.60) calc(var(--hero-logo) * 0.62) at calc(100% - var(--hero-logo) / 2) calc(var(--hero-logo-top) + var(--hero-logo) * 0.52), transparent 38%, black 100%)';

export default function Hero({ stats }: HeroProps) {
  const statItems = [
    { v: stats.events, l: 'мероприятий' },
    { v: stats.participants, l: 'участников' },
    { v: stats.partners, l: 'партнёров' },
  ];

  return (
    <section className="tc-hero relative overflow-hidden bg-[linear-gradient(155deg,#FF511C_0%,#C42315_42%,#A81313_72%,#8C0F0F_100%)] text-white [clip-path:polygon(0_0,100%_0,100%_calc(100%-3.5rem),0_100%)]">
      {/* The drifting streaks are masked out behind the logo so they stop
          crossing it. The hole is driven by the same --hero-logo variable that
          sizes the video, so the two can never drift apart, and it fades out
          gradually — a hard edge would read as a bug. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          maskImage: HOLE,
          WebkitMaskImage: HOLE,
        }}
      >
        <CometStreaks tone="flame" density={30} seed={5} className="opacity-80" />
      </div>

      {/* Animated logo, pinned to the top-right corner of the red block. It is
          taken out of the grid flow so it can actually reach the corner; the
          empty second grid column below reserves the space so the copy never
          runs underneath it on desktop. */}
      <HeroLogoVideo className="absolute right-0 top-[var(--hero-logo-top)] z-10 w-[var(--hero-logo)]" />

      {/* Below lg the hero is a single column, so the copy is pushed down to
          clear the corner logo instead of running underneath it. From lg the
          empty spacer column keeps them apart and normal padding returns. */}
      <div className="container-tc relative grid items-center gap-12 pb-24 pt-[calc(var(--hero-logo)*1.06+40px)] sm:pb-32 lg:grid-cols-[1.1fr_0.9fr] lg:py-20 lg:pb-32 lg:pt-24">
        <div>
          <Plate variant="cream" slash className="display text-xs sm:text-sm">
            {SITE.university} · {SITE.city}
          </Plate>

          <h1 className="display mt-7 text-[clamp(2rem,5.4vw,4.2rem)] leading-none">
            <span className="tc-plate tc-plate-cream inline-block">Объединяем</span>
            <span className="tc-plate tc-plate-deep mt-3 inline-block sm:ml-10">
              студентов <span className="text-[0.65em]">и</span> IT
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-lg font-medium leading-relaxed text-white/90">
            {SITE.name} проводит митапы, хакатоны и форумы, даёт практику техническим
            специальностям и помогает студентам {SITE.university} с трудоустройством.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <FollowNews variant="cream" />
            <Link href="/events" className="btn-outline-cream">
              Ближайшие мероприятия
            </Link>
          </div>

          <dl className="mt-12 flex flex-wrap gap-x-4 gap-y-5">
            {statItems.map((s) => (
              <div key={s.l} className="tc-plate tc-plate-cream px-4 py-1.5">
                <dt className="display text-2xl sm:text-3xl">
                  <CountUp value={s.v} />
                </dt>
                <dd className="text-xs font-bold text-crimson/70">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* spacer: keeps the desktop copy clear of the corner logo above */}
        <div aria-hidden className="hidden lg:block" />
      </div>
    </section>
  );
}
