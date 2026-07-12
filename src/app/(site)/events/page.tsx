import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import PageHeader from '@/components/PageHeader';
import EventRoadmap from '@/components/EventRoadmap';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Мероприятия' };

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: [{ date: 'asc' }, { order: 'asc' }],
  });

  return (
    <>
      <PageHeader
        plate="Дорожная карта"
        title="Карта мероприятий"
        description="Путь объединения — от первых митапов к большим хакатонам и форумам. Пройденные остановки и то, что ждёт впереди."
        seed={29}
      />

      {/* full-width roadmap */}
      <div className="section">
        <EventRoadmap events={events} />
      </div>
    </>
  );
}
