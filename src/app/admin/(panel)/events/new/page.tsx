import AdminHeader from '@/components/admin/AdminHeader';
import EventForm from '@/components/admin/EventForm';
import { createEvent } from '@/lib/actions/events';

export default function NewEventPage() {
  return (
    <>
      <AdminHeader title="Новое мероприятие" back={{ href: '/admin/events', label: 'К списку мероприятий' }} />
      <EventForm action={createEvent} submitLabel="Создать" />
    </>
  );
}
