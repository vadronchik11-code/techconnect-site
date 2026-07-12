import { prisma } from '@/lib/prisma';
import AdminHeader from '@/components/admin/AdminHeader';
import ApplicationRow from '@/components/admin/ApplicationRow';

export const dynamic = 'force-dynamic';

export default async function AdminApplicationsList() {
  const apps = await prisma.application.findMany({ orderBy: { createdAt: 'desc' } });
  const newCount = apps.filter((a) => a.status === 'NEW').length;

  return (
    <>
      <AdminHeader
        title="Заявки"
        description={apps.length ? `${apps.length} всего · ${newCount} новых` : 'Заявки на вступление в объединение.'}
      />

      {apps.length === 0 ? (
        <div className="card grid place-items-center p-16 text-center text-ink/50">
          Заявок пока нет. Они появятся здесь после отправки формы на странице «Контакты».
        </div>
      ) : (
        <div className="card divide-y divide-ink/[0.06] overflow-hidden">
          {apps.map((a) => (
            <ApplicationRow key={a.id} app={a} />
          ))}
        </div>
      )}
    </>
  );
}
