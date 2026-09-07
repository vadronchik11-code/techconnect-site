import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import CometStreaks from '@/components/CometStreaks';
import Plate from '@/components/Plate';
import EventRoadmap from '@/components/EventRoadmap';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Мероприятия' };

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: [{ date: 'asc' }, { order: 'asc' }],
  });

  return (
    <div className="flex flex-col">
      {/* Slim title strip — kept short on purpose so the roadmap below gets
          the whole rest of the viewport and never needs a vertical scroll. */}
      <header className="relative overflow-hidden bg-[linear-gradient(150deg,#FF511C_-15%,#A81313_60%)] py-5">
        <CometStreaks tone="flame" density={10} seed={29} className="opacity-60" />
        <div className="container-tc relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <Plate variant="cream" slash className="display text-xs">
              Дорожная карта
            </Plate>
            <h1 className="display mt-1.5 text-2xl text-cream sm:text-3xl">Карта мероприятий</h1>
          </div>
          <p className="text-sm font-medium text-white/80">Листайте дорожку по горизонтали →</p>
        </div>
      </header>

      <EventRoadmap events={events} />
    </div>
  );
}
