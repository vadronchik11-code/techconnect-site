'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin } from 'lucide-react';
import { EVENT_TYPES, EVENT_STATUS, type EventType, type EventStatus } from '@/lib/constants';
import { EventTypeIcon } from './icons';
import { formatDate, cn } from '@/lib/utils';

export interface RoadmapEvent {
  id: string;
  title: string;
  type: string;
  status: string;
  description: string;
  location: string | null;
  date: Date | string;
  coverImage: string | null;
  registrationUrl: string | null;
  isFinal?: boolean;
}

// horizontal road geometry
const STEP = 340;
const PAD = 70;
const H = 760;
const BASE_Y = 372;
const AMP = 52;
const NODE_R = 30;
const OFFSET = 56;
const CARD_W = 300;

function typeMeta(type: string) {
  return EVENT_TYPES[type as EventType] ?? EVENT_TYPES.OTHER;
}
function statusMeta(status: string) {
  return EVENT_STATUS[status as EventStatus] ?? EVENT_STATUS.UPCOMING;
}

function StatusChip({ status }: { status: string }) {
  const meta = statusMeta(status);
  return (
    <span
      className={cn(
        'chip',
        meta.tone === 'past' && 'bg-ink/5 text-ink/50',
        meta.tone === 'ongoing' && 'bg-flame text-white',
        meta.tone === 'upcoming' && 'bg-cream text-crimson'
      )}
    >
      {meta.tone === 'ongoing' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
      {meta.label}
    </span>
  );
}

function EventCard({ event, compact = false }: { event: RoadmapEvent; compact?: boolean }) {
  const t = typeMeta(event.type);
  return (
    <article className={cn('card overflow-hidden', compact ? 'p-4' : 'p-5')}>
      {event.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={event.coverImage} alt={event.title} className="mb-3 aspect-[16/9] w-full rounded-xl object-cover" />
      )}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="chip bg-flame-gradient text-white">
          <EventTypeIcon type={event.type} className="h-3.5 w-3.5" /> {t.label}
        </span>
        <StatusChip status={event.status} />
        {event.isFinal && <span className="chip bg-crimson text-white">Финал дорожки</span>}
      </div>
      <p className="text-sm font-semibold text-crimson">{formatDate(event.date)}</p>
      <h3 className="mt-1 text-lg font-extrabold leading-snug text-ink">
        <Link href={`/events/${event.id}`} className="transition-colors hover:text-flame">
          {event.title}
        </Link>
      </h3>
      <p className="mt-1.5 line-clamp-3 text-sm text-ink/60">{event.description}</p>
      {event.location && (
        <p className="mt-2 flex items-center gap-1 text-sm text-ink/50">
          <MapPin className="h-3.5 w-3.5" /> {event.location}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {event.registrationUrl && event.status !== 'PAST' && (
          <a
            href={event.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary !py-2 text-sm"
          >
            Регистрация →
          </a>
        )}
        <Link href={`/events/${event.id}`} className="text-sm font-bold text-flame hover:text-crimson">
          Подробнее →
        </Link>
      </div>
    </article>
  );
}

export default function EventRoadmap({ events }: { events: RoadmapEvent[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  const n = events.length;
  const width = PAD * 2 + n * STEP;

  const nodes = events.map((_, i) => ({
    x: PAD + i * STEP + STEP / 2,
    y: BASE_Y + (i % 2 === 0 ? -AMP : AMP),
  }));

  // The road starts AT the first event. It ends at the event explicitly marked
  // as final; if none is marked, the line runs off the right edge — the journey
  // continues, its end just isn't known yet.
  const hasFinal = events.some((e) => e.isFinal);
  const pts = [...nodes];
  if (!hasFinal && pts.length > 0) pts.push({ x: width + 12, y: BASE_Y });

  let d = pts.length > 0 ? `M ${pts[0].x} ${pts[0].y}` : '';
  for (let i = 1; i < pts.length; i++) {
    const midX = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C ${midX} ${pts[i - 1].y}, ${midX} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = pathRef.current;
    const wrap = wrapRef.current;
    if (!path || !wrap) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len });

    if (reduce) {
      gsap.set(path, { strokeDashoffset: 0 });
      return;
    }

    gsap.set(path, { strokeDashoffset: len });
    const tween = gsap.to(path, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: { trigger: wrap, start: 'top 80%', once: true },
      duration: 1.6,
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [d]);

  if (n === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-ink/15 bg-cream/30 py-16 text-center text-ink/50">
        Мероприятия скоро появятся.
      </p>
    );
  }

  return (
    <div ref={wrapRef} className="w-full">
      {/* Full-width horizontal winding road (scrolls on any screen) */}
      <div>
        <p className="container-tc mb-3 flex items-center justify-end gap-2 text-sm text-ink/40">
          <span aria-hidden>←</span> листайте, чтобы пройти весь путь <span aria-hidden>→</span>
        </p>
        <div className="tc-scroll overflow-x-auto px-5 pb-5 sm:px-8">
          <div className="relative" style={{ width, height: H }}>
            <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} className="absolute inset-0" aria-hidden>
              <defs>
                <linearGradient id="tc-road-h" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FFA009" />
                  <stop offset="50%" stopColor="#FF511C" />
                  <stop offset="100%" stopColor="#A81313" />
                </linearGradient>
              </defs>
              {/* ghost base */}
              <path d={d} fill="none" stroke="#000" strokeOpacity={0.06} strokeWidth={16} strokeLinecap="round" />
              {/* flame road (animated draw) */}
              <path
                ref={pathRef}
                d={d}
                fill="none"
                stroke="url(#tc-road-h)"
                strokeWidth={14}
                strokeLinecap="round"
              />
              {/* dashed centre lane */}
              <path d={d} fill="none" stroke="#fff" strokeWidth={2.5} strokeDasharray="2 20" strokeLinecap="round" opacity={0.75} />
              {/* connectors from node to card */}
              {nodes.map((node, i) => {
                const up = i % 2 === 0;
                const y2 = up ? node.y - OFFSET : node.y + OFFSET;
                return (
                  <line
                    key={i}
                    x1={node.x}
                    y1={up ? node.y - NODE_R : node.y + NODE_R}
                    x2={node.x}
                    y2={y2}
                    stroke="#FF511C"
                    strokeWidth={2}
                    strokeDasharray="3 4"
                    opacity={0.5}
                  />
                );
              })}
            </svg>

            {events.map((event, i) => {
              const node = nodes[i];
              const up = i % 2 === 0;
              return (
                <div key={event.id}>
                  {/* numbered stop */}
                  <div
                    className={cn(
                      'absolute z-10 grid place-items-center rounded-full ring-4 ring-white animate-fade-up',
                      event.isFinal
                        ? 'border-[3px] border-crimson bg-flame-gradient text-white shadow-glow'
                        : 'border-[3px] border-flame bg-cream text-crimson'
                    )}
                    style={{
                      left: node.x - NODE_R,
                      top: node.y - NODE_R,
                      width: NODE_R * 2,
                      height: NODE_R * 2,
                      animationDelay: `${i * 0.08}s`,
                    }}
                  >
                    <span className="display text-xl">{i + 1}</span>
                  </div>
                  {/* card */}
                  <div
                    className="absolute z-10 animate-fade-up"
                    style={{
                      left: node.x - CARD_W / 2,
                      width: CARD_W,
                      animationDelay: `${i * 0.08 + 0.05}s`,
                      ...(up ? { bottom: H - (node.y - OFFSET) } : { top: node.y + OFFSET }),
                    }}
                  >
                    <EventCard event={event} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
