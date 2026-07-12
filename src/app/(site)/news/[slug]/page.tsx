import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import Markdown from '@/components/Markdown';
import { formatDate, readingTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Drafts are visible only to logged-in team members (preview mode);
 * everyone else gets a 404 until the news is published.
 */
async function getNews(slug: string) {
  const news = await prisma.news.findFirst({
    where: { slug },
    include: { author: { select: { name: true } } },
  });
  if (!news) return null;
  if (!news.published) {
    const session = await getSession();
    if (!session) return null;
  }
  return news;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const news = await getNews(slug);
  if (!news) return { title: 'Новость не найдена' };
  return {
    title: news.published ? news.title : `[Черновик] ${news.title}`,
    description: news.excerpt,
    robots: news.published ? undefined : { index: false, follow: false },
    openGraph: {
      title: news.title,
      description: news.excerpt,
      images: news.coverImage ? [news.coverImage] : undefined,
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const news = await getNews(slug);
  if (!news) notFound();

  const tags = news.tags ? news.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  return (
    <article className="section">
      <div className="container-tc max-w-3xl">
        {!news.published && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-cream px-5 py-4">
            <p className="font-bold text-crimson">
              Черновик — эту страницу видите только вы (выполнен вход в админку).
            </p>
            <Link href={`/admin/news/${news.id}`} className="btn-primary !py-2 text-sm">
              Редактировать / опубликовать
            </Link>
          </div>
        )}

        <Link href="/news" className="inline-flex items-center gap-1.5 text-sm font-semibold text-flame hover:gap-2">
          <span aria-hidden>←</span> Все новости
        </Link>

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-ink/50">
            {news.publishedAt && <time>{formatDate(news.publishedAt)}</time>}
            <span aria-hidden>·</span>
            <span>{readingTime(news.contentMd)} мин чтения</span>
            {news.author?.name && (
              <>
                <span aria-hidden>·</span>
                <span>{news.author.name}</span>
              </>
            )}
          </div>
          <h1 className="mt-4 font-display text-3xl font-black leading-tight text-ink sm:text-4xl md:text-5xl">
            {news.title}
          </h1>
          {tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="chip bg-cream text-crimson">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {news.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={news.coverImage} alt={news.title} className="mt-8 aspect-[16/9] w-full rounded-xl object-cover" />
        )}

        <div className="mt-10">
          <Markdown content={news.contentMd} />
        </div>
      </div>
    </article>
  );
}
