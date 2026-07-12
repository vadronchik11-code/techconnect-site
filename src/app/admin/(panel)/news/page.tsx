import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import AdminHeader from '@/components/admin/AdminHeader';
import DeleteButton from '@/components/admin/DeleteButton';
import { deleteNews } from '@/lib/actions/news';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminNewsList() {
  const news = await prisma.news.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <>
      <AdminHeader title="Новости" description="Управление новостной лентой." action={{ href: '/admin/news/new', label: '+ Новость' }} />

      {news.length === 0 ? (
        <div className="card grid place-items-center p-16 text-center text-ink/50">
          <p>Новостей пока нет.</p>
          <Link href="/admin/news/new" className="btn-primary mt-4">Написать первую</Link>
        </div>
      ) : (
        <div className="card divide-y divide-ink/[0.06] overflow-hidden">
          {news.map((n) => (
            <div key={n.id} className="flex items-center gap-4 p-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-flame-gradient text-white">
                {n.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.coverImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-black">TC</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{n.title}</p>
                <p className="text-sm text-ink/50">
                  {n.publishedAt ? formatDate(n.publishedAt) : formatDate(n.createdAt)} · /{n.slug}
                </p>
              </div>
              <span className={`chip shrink-0 ${n.published ? 'bg-flame text-white' : 'bg-ink/5 text-ink/50'}`}>
                {n.published ? 'Опубликовано' : 'Черновик'}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <a
                  href={`/news/${n.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink/70 hover:bg-cream"
                  title={n.published ? 'Открыть на сайте' : 'Превью черновика — видно только вошедшим в админку'}
                >
                  Просмотр
                </a>
                <Link href={`/admin/news/${n.id}`} className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink/70 hover:bg-cream">
                  Изменить
                </Link>
                <DeleteButton action={deleteNews} id={n.id} confirmText={`Удалить новость «${n.title}»?`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
