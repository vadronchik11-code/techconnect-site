import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdminHeader from '@/components/admin/AdminHeader';
import EventForm from '@/components/admin/EventForm';
import { updateEvent } from '@/lib/actions/events';
import { toDatetimeLocal } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();

  const action = updateEvent.bind(null, id);

  return (
    <>
      <AdminHeader title="Редактирование мероприятия" back={{ href: '/admin/events', label: 'К списку мероприятий' }} />
      <EventForm
        action={action}
        submitLabel="Сохранить"
        values={{
          title: event.title,
          type: event.type,
          status: event.status,
          description: event.description,
          location: event.location,
          date: toDatetimeLocal(event.date),
          registrationUrl: event.registrationUrl,
          coverImage: event.coverImage,
          order: event.order,
          isFinal: event.isFinal,
        }}
      />
    </>
  );
}
