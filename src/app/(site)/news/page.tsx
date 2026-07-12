import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import PageHeader from '@/components/PageHeader';
import NewsCard from '@/components/NewsCard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Новости' };

export default async function NewsPage() {
  const news = await prisma.news.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
  });

  return (
    <>
      <PageHeader
        plate="Новостная лента"
        title="Новости"
        description="Анонсы, отчёты о мероприятиях и всё важное из жизни объединения."
        seed={13}
      />

      <div className="section">
        <div className="container-tc">
          {news.length === 0 ? (
            <p className="rounded-xl border-2 border-dashed border-ink/15 bg-cream/30 py-16 text-center text-ink/55">
              Пока новостей нет. Загляните позже!
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((n) => (
                <NewsCard key={n.id} news={n} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
