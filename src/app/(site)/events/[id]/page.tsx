import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, CalendarDays } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import CometStreaks from '@/components/CometStreaks';
import { EventTypeIcon } from '@/components/icons';
import { EVENT_TYPES, EVENT_STATUS, type EventType, type EventStatus } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

async function getEvent(id: string) {
  return prisma.event.findUnique({ where: { id } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: 'Мероприятие не найдено' };
  return {
    title: event.title,
    description: event.description.slice(0, 160),
    openGraph: {
      title: event.title,
      description: event.description.slice(0, 160),
      images: event.coverImage ? [event.coverImage] : undefined,
    },
  };
}

export default async function EventPage({ params }: Props) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const t = EVENT_TYPES[event.type as EventType] ?? EVENT_TYPES.OTHER;
  const s = EVENT_STATUS[event.status as EventStatus] ?? EVENT_STATUS.UPCOMING;
  const isPast = event.status === 'PAST';

  return (
    <>
      <header className="relative overflow-hidden bg-[linear-gradient(150deg,#FF511C_-15%,#A81313_60%)] text-white">
        <CometStreaks tone="flame" density={18} seed={event.title.length + 7} className="opacity-70" />
        <div className="container-tc relative py-14 sm:py-20">
          <Link href="/events" className="inline-flex items-center gap-1.5 text-sm font-bold text-cream/90 transition-colors hover:text-white">
            <span aria-hidden>←</span> Вся карта мероприятий
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="chip bg-cream text-crimson">
              <EventTypeIcon type={event.type} className="h-3.5 w-3.5" /> {t.label}
            </span>
            <span className="chip bg-white/15 text-white">{s.label}</span>
            {event.isFinal && <span className="chip bg-white text-crimson">Финал дорожки</span>}
          </div>

          <h1 className="display mt-5 max-w-3xl text-3xl leading-[1.06] text-cream sm:text-5xl">
            {event.title}
          </h1>

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-white/90">
            <p className="flex items-center gap-2 font-semibold">
              <CalendarDays className="h-5 w-5 text-cream" aria-hidden />
              {formatDateTime(event.date)}
            </p>
            {event.location && (
              <p className="flex items-center gap-2 font-semibold">
                <MapPin className="h-5 w-5 text-cream" aria-hidden />
                {event.location}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="section">
        <div className="container-tc max-w-3xl">
          {event.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.coverImage}
              alt={event.title}
              className="mb-10 aspect-[16/9] w-full rounded-xl object-cover"
            />
          )}

          {event.description ? (
            <p className="whitespace-pre-line text-lg leading-relaxed text-ink/75">{event.description}</p>
          ) : (
            <p className="text-lg text-ink/50">Подробности скоро появятся.</p>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-4">
            {event.registrationUrl && !isPast && (
              <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                Зарегистрироваться →
              </a>
            )}
            <Link href="/events" className="btn-outline">
              К дорожной карте
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
