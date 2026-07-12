import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import AdminHeader from '@/components/admin/AdminHeader';
import DeleteButton from '@/components/admin/DeleteButton';
import SortableAdminList from '@/components/admin/SortableAdminList';
import { deletePortfolio, reorderPortfolio } from '@/lib/actions/portfolio';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminPortfolioList() {
  const items = await prisma.portfolioItem.findMany({ orderBy: { order: 'asc' } });

  return (
    <>
      <AdminHeader title="Портфолио" description="Кейсы проведённых мероприятий. Перетащите, чтобы изменить порядок." action={{ href: '/admin/portfolio/new', label: '+ Кейс' }} />

      {items.length === 0 ? (
        <div className="card grid place-items-center p-16 text-center text-ink/50">
          <p>Кейсов пока нет.</p>
          <Link href="/admin/portfolio/new" className="btn-primary mt-4">Добавить первый</Link>
        </div>
      ) : (
        <SortableAdminList
          onReorder={reorderPortfolio}
          items={items.map((item) => ({
            id: item.id,
            content: (
              <>
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-flame-gradient text-white">
                  {item.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.coverImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-black">TC</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{item.title}</p>
                  <p className="text-sm text-ink/50">
                    {item.date ? formatDate(item.date) : '—'}
                    {item.participants != null ? ` · ${item.participants} участников` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Link href={`/admin/portfolio/${item.id}`} className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink/70 hover:bg-cream">
                    Изменить
                  </Link>
                  <DeleteButton action={deletePortfolio} id={item.id} confirmText={`Удалить «${item.title}»?`} />
                </div>
              </>
            ),
          }))}
        />
      )}
    </>
  );
}
