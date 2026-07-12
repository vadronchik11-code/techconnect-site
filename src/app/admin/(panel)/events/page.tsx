import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import AdminHeader from '@/components/admin/AdminHeader';
import DeleteButton from '@/components/admin/DeleteButton';
import SortableAdminList from '@/components/admin/SortableAdminList';
import { deleteEvent, reorderEvents } from '@/lib/actions/events';
import { formatDate } from '@/lib/utils';
import { EVENT_TYPES, EVENT_STATUS, type EventType, type EventStatus } from '@/lib/constants';
import { EventTypeIcon } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default async function AdminEventsList() {
  const events = await prisma.event.findMany({ orderBy: [{ order: 'asc' }, { date: 'asc' }] });

  return (
    <>
      <AdminHeader
        title="Мероприятия"
        description="Остановки на дорожной карте (публичная карта сортируется по дате; порядок здесь решает лишь при совпадении дат). Перетащите, чтобы изменить порядок в этом списке."
        action={{ href: '/admin/events/new', label: '+ Мероприятие' }}
      />

      {events.length === 0 ? (
        <div className="card grid place-items-center p-16 text-center text-ink/50">
          <p>Мероприятий пока нет.</p>
          <Link href="/admin/events/new" className="btn-primary mt-4">Добавить первое</Link>
        </div>
      ) : (
        <SortableAdminList
          onReorder={reorderEvents}
          items={events.map((e) => {
            const t = EVENT_TYPES[e.type as EventType] ?? EVENT_TYPES.OTHER;
            const s = EVENT_STATUS[e.status as EventStatus] ?? EVENT_STATUS.UPCOMING;
            return {
              id: e.id,
              content: (
                <>
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-cream text-crimson">
                    <EventTypeIcon type={e.type} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{e.title}</p>
                    <p className="text-sm text-ink/50">{formatDate(e.date)} · {t.label}{e.location ? ` · ${e.location}` : ''}</p>
                  </div>
                  {e.isFinal && <span className="chip shrink-0 bg-crimson text-white">Финал</span>}
                  <span className="chip shrink-0 bg-cream text-crimson">{s.label}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <Link href={`/admin/events/${e.id}`} className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink/70 hover:bg-cream">
                      Изменить
                    </Link>
                    <DeleteButton action={deleteEvent} id={e.id} confirmText={`Удалить «${e.title}»?`} />
                  </div>
                </>
              ),
            };
          })}
        />
      )}
    </>
  );
}
