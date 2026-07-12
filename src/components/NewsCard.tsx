import Link from 'next/link';
import AnimatedLogo from './AnimatedLogo';
import CometStreaks from './CometStreaks';
import { formatDate } from '@/lib/utils';

export interface NewsCardData {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  tags: string;
  publishedAt: Date | string | null;
}

export default function NewsCard({ news, featured = false }: { news: NewsCardData; featured?: boolean }) {
  const tags = news.tags ? news.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  return (
    <Link
      href={`/news/${news.slug}`}
      className="card group flex flex-col overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {news.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={news.coverImage}
            alt={news.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center bg-fire-deep">
            <CometStreaks tone="flame" density={10} seed={news.slug.length} drift={false} />
            <AnimatedLogo className="relative h-20 w-20" />
          </div>
        )}
        {news.publishedAt && (
          <span className="chip absolute left-4 top-4 bg-white/95 text-crimson backdrop-blur">
            {formatDate(news.publishedAt)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="chip bg-cream text-crimson">
              #{tag}
            </span>
          ))}
        </div>
        <h3 className={featured ? 'text-2xl font-extrabold leading-snug text-ink' : 'text-xl font-bold leading-snug text-ink'}>
          {news.title}
        </h3>
        <p className="mt-3 line-clamp-3 flex-1 text-ink/65">{news.excerpt}</p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-flame">
          Читать
          <span className="transition-transform group-hover:translate-x-1" aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}
