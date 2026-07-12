import Link from 'next/link';
import AnimatedLogo from './AnimatedLogo';
import CometStreaks from './CometStreaks';
import FollowNews from './FollowNews';
import Plate from './Plate';
import { SITE } from '@/lib/constants';

interface HeroProps {
  stats: { events: string; participants: string; partners: string };
}

export default function Hero({ stats }: HeroProps) {
  const statItems = [
    { v: stats.events, l: 'мероприятий' },
    { v: stats.participants, l: 'участников' },
    { v: stats.partners, l: 'партнёров' },
  ];

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(155deg,#FF511C_0%,#C42315_42%,#A81313_72%,#8C0F0F_100%)] text-white [clip-path:polygon(0_0,100%_0,100%_calc(100%-3.5rem),0_100%)]">
      <CometStreaks tone="flame" density={30} seed={5} className="opacity-80" />

      <div className="container-tc relative grid items-center gap-12 py-16 pb-24 sm:py-20 sm:pb-32 lg:grid-cols-[1.1fr_0.9fr]">
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
                <dt className="display text-2xl sm:text-3xl">{s.v}</dt>
                <dd className="text-xs font-bold text-crimson/70">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative hidden justify-center lg:flex lg:justify-end">
          <AnimatedLogo className="h-auto w-full max-w-md drop-shadow-[0_24px_48px_rgba(0,0,0,0.25)]" />
        </div>
      </div>
    </section>
  );
}
