import Link from 'next/link';
import { Megaphone, GraduationCap, Rocket, MapPin } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import Hero from '@/components/Hero';
import CometStreaks from '@/components/CometStreaks';
import SectionHeading from '@/components/SectionHeading';
import PartnersMarquee from '@/components/PartnersMarquee';
import NewsCard from '@/components/NewsCard';
import { EventTypeIcon } from '@/components/icons';
import { SITE, EVENT_TYPES, type EventType } from '@/lib/constants';
import { getSettings } from '@/lib/settings';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const FORMATS = ['Митапы', 'Хакатоны', 'Форумы', 'Смена', 'Факториум'];

export default async function HomePage() {
  const [latestNews, partners, upcoming, eventsCount, settings] = await Promise.all([
    prisma.news.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    }),
    prisma.partner.findMany({ orderBy: { order: 'asc' } }),
    prisma.event.findMany({
      where: { status: { not: 'PAST' } },
      orderBy: { date: 'asc' },
      take: 3,
    }),
    prisma.event.count(),
    getSettings(),
  ]);

  return (
    <>
      <Hero
        stats={{
          events: String(eventsCount),
          participants: settings.statParticipants,
          partners: String(partners.length),
        }}
      />

      {/* Value props — asymmetric: events lead, practice & jobs support */}
      <section className="section">
        <div className="container-tc">
          <SectionHeading
            plate="Что мы делаем"
            title="Короткий путь от студента до оффера"
            description="Три направления, которые складываются в одну экосистему развития."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-5">
            <div className="relative overflow-hidden rounded-xl bg-cream p-8 sm:p-10 lg:col-span-3">
              <CometStreaks tone="cream" density={12} seed={3} className="opacity-70" />
              <div className="relative">
                <div className="grid h-14 w-14 place-items-center rounded-lg bg-flame-gradient text-white">
                  <Megaphone className="h-7 w-7" strokeWidth={2} aria-hidden />
                </div>
                <h3 className="display mt-6 text-2xl text-crimson sm:text-3xl">Мероприятия</h3>
                <p className="mt-3 max-w-md leading-relaxed text-ink/70">
                  Митапы, хакатоны и форумы, где студенты прокачивают навыки, собирают команды
                  и знакомятся с индустрией лицом к лицу.
                </p>
                <div className="mt-6 flex flex-wrap gap-x-4 gap-y-3">
                  {FORMATS.map((f) => (
                    <span key={f} className="tc-plate tc-plate-white display px-3 text-xs">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:col-span-2">
              <div className="card p-7">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-cream">
                  <GraduationCap className="h-6 w-6 text-crimson" strokeWidth={2} aria-hidden />
                </div>
                <h3 className="display mt-4 text-xl text-ink">Практика</h3>
                <p className="mt-2 leading-relaxed text-ink/65">
                  Реальные задачи от партнёров, командная разработка и менторство от практикующих инженеров.
                </p>
              </div>
              <div className="card p-7">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-cream">
                  <Rocket className="h-6 w-6 text-crimson" strokeWidth={2} aria-hidden />
                </div>
                <h3 className="display mt-4 text-xl text-ink">Трудоустройство</h3>
                <p className="mt-2 leading-relaxed text-ink/65">
                  Карьерные форумы, разбор резюме и прямой контакт с работодателями региона.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      {partners.length > 0 && (
        <section className="relative overflow-hidden border-y-2 border-crimson/10 bg-cream/50 py-14">
          <div className="container-tc relative">
            <p className="display mb-8 text-center text-sm text-crimson">Нам доверяют партнёры</p>
          </div>
          <PartnersMarquee names={partners.map((p) => p.name)} />
        </section>
      )}

      {/* Upcoming events */}
      {upcoming.length > 0 && (
        <section className="section">
          <div className="container-tc">
            <SectionHeading
              plate="Афиша"
              title="Ближайшие мероприятия"
              action={{ href: '/events', label: 'Вся дорожная карта' }}
            />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {upcoming.map((e) => {
                const t = EVENT_TYPES[e.type as EventType] ?? EVENT_TYPES.OTHER;
                return (
                  <Link
                    key={e.id}
                    href={`/events/${e.id}`}
                    className="card group flex flex-col p-7 transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
                  >
                    <span className="chip w-fit bg-flame-gradient text-white">
                      <EventTypeIcon type={e.type} className="h-3.5 w-3.5" /> {t.label}
                    </span>
                    <p className="mt-4 text-sm font-bold text-crimson">{formatDate(e.date)}</p>
                    <h3 className="mt-1 text-xl font-bold leading-snug text-ink">{e.title}</h3>
                    <p className="mt-2 line-clamp-2 flex-1 text-ink/65">{e.description}</p>
                    {e.location && (
                      <p className="mt-4 flex items-center gap-1 text-sm text-ink/55">
                        <MapPin className="h-3.5 w-3.5" aria-hidden /> {e.location}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Latest news */}
      {latestNews.length > 0 && (
        <section className="section bg-cream/40">
          <div className="container-tc">
            <SectionHeading
              plate="Новости"
              title="Последнее из жизни объединения"
              action={{ href: '/news', label: 'Все новости' }}
            />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {latestNews.map((n) => (
                <NewsCard key={n.id} news={n} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section">
        <div className="container-tc">
          <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(150deg,#C42315_0%,#8C0F0F_100%)] px-8 py-16 text-center text-white sm:px-16 sm:py-20">
            <CometStreaks tone="flame" density={20} seed={17} className="opacity-70" />
            <div className="relative">
              <h2 className="display mx-auto max-w-2xl text-3xl leading-[1.08] sm:text-4xl">
                Хочешь развиваться <span className="tc-plate tc-plate-cream">в IT</span> вместе с нами?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg font-medium text-white/90">
                Присоединяйся к {SITE.name} — участвуй в мероприятиях, получай практику и находи работу мечты.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-4">
                <a href={SITE.telegram} target="_blank" rel="noopener noreferrer" className="btn-cream">
                  Присоединиться
                </a>
                <Link href="/contacts" className="btn-outline-cream">
                  Связаться с нами
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
