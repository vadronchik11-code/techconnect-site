import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import AdminHeader from '@/components/admin/AdminHeader';
import { formatDate } from '@/lib/utils';
import { APPLICATION_STATUS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [news, publishedNews, events, partners, portfolio, applications, newApps, recentApps] = await Promise.all([
    prisma.news.count(),
    prisma.news.count({ where: { published: true } }),
    prisma.event.count(),
    prisma.partner.count(),
    prisma.portfolioItem.count(),
    prisma.application.count(),
    prisma.application.count({ where: { status: 'NEW' } }),
    prisma.application.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
  ]);

  const stats = [
    { label: 'Новости', value: news, sub: `${publishedNews} опубликовано`, href: '/admin/news' },
    { label: 'Мероприятия', value: events, sub: 'в дорожной карте', href: '/admin/events' },
    { label: 'Портфолио', value: portfolio, sub: 'кейсов', href: '/admin/portfolio' },
    { label: 'Партнёры', value: partners, sub: 'организаций', href: '/admin/partners' },
    { label: 'Заявки', value: applications, sub: `${newApps} новых`, href: '/admin/applications', highlight: newApps > 0 },
  ];

  return (
    <>
      <AdminHeader title="Обзор" description="Сводка по контенту сайта TechConnect." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="card group flex items-center justify-between p-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-glow"
          >
            <div>
              <p className="text-sm font-medium text-ink/55">{s.label}</p>
              <p className="mt-1 font-display text-4xl font-black text-ink">{s.value}</p>
              <p className="mt-1 text-xs text-ink/45">{s.sub}</p>
            </div>
            {s.highlight ? (
              <span className="chip bg-flame text-white">!</span>
            ) : (
              <span className="text-2xl text-ink/20 transition-colors group-hover:text-flame">→</span>
            )}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-ink">Последние заявки</h2>
            <Link href="/admin/applications" className="text-sm font-semibold text-flame hover:underline">
              Все →
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <p className="py-8 text-center text-ink/40">Заявок пока нет</p>
          ) : (
            <ul className="divide-y divide-ink/[0.06]">
              {recentApps.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{a.name}</p>
                    <p className="truncate text-sm text-ink/50">
                      {a.role || '—'} · {a.contact}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="chip bg-cream text-crimson">{APPLICATION_STATUS[a.status as keyof typeof APPLICATION_STATUS] ?? a.status}</span>
                    <p className="mt-1 text-xs text-ink/40">{formatDate(a.createdAt, false)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-lg font-extrabold text-ink">Быстрые действия</h2>
          <div className="grid gap-3">
            <Link href="/admin/news/new" className="btn-outline justify-start !py-3">📰 Написать новость</Link>
            <Link href="/admin/events/new" className="btn-outline justify-start !py-3">🗓️ Добавить мероприятие</Link>
            <Link href="/admin/portfolio/new" className="btn-outline justify-start !py-3">💼 Добавить кейс в портфолио</Link>
            <Link href="/admin/partners/new" className="btn-outline justify-start !py-3">🤝 Добавить партнёра</Link>
          </div>
        </div>
      </div>
    </>
  );
}
