import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import PageHeader from '@/components/PageHeader';
import CometStreaks from '@/components/CometStreaks';
import AnimatedLogo from '@/components/AnimatedLogo';
import Markdown from '@/components/Markdown';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Портфолио' };

export default async function PortfolioPage() {
  const items = await prisma.portfolioItem.findMany({ orderBy: { order: 'asc' } });

  return (
    <>
      <PageHeader
        plate="Наши кейсы"
        title="Портфолио"
        description="Что мы уже провели и каких результатов добились вместе с участниками и партнёрами."
        seed={37}
      />

      <div className="section">
        <div className="container-tc">
          {items.length === 0 ? (
            <p className="rounded-xl border-2 border-dashed border-ink/15 bg-cream/30 py-16 text-center text-ink/55">
              Кейсы скоро появятся.
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {items.map((item, idx) => (
                <article key={item.id} className="card group overflow-hidden">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    {item.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.coverImage} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="relative grid h-full w-full place-items-center bg-fire-deep">
                        <CometStreaks tone="flame" density={10} seed={idx + 3} drift={false} />
                        <AnimatedLogo className="relative h-20 w-20" />
                      </div>
                    )}
                  </div>
                  <div className="p-7">
                    {item.date && <p className="text-sm font-bold text-crimson">{formatDate(item.date)}</p>}
                    <h3 className="mt-1 text-2xl font-extrabold text-ink">{item.title}</h3>
                    {item.description && <Markdown content={item.description} compact className="mt-3 text-ink/65" />}
                    <div className="mt-6 flex flex-wrap gap-x-4 gap-y-3 border-t-2 border-ink/[0.06] pt-5">
                      {item.participants != null && (
                        <div className="tc-plate tc-plate-cream px-3 py-1">
                          <p className="display text-xl">{item.participants}</p>
                          <p className="text-xs font-semibold text-crimson/70">участников</p>
                        </div>
                      )}
                      {item.partnersCount != null && (
                        <div className="tc-plate tc-plate-cream px-3 py-1">
                          <p className="display text-xl">{item.partnersCount}</p>
                          <p className="text-xs font-semibold text-crimson/70">партнёров</p>
                        </div>
                      )}
                      {item.resultText && (
                        <div className="min-w-[8rem] py-1">
                          <p className="font-display text-base font-bold text-crimson">{item.resultText}</p>
                          <p className="text-xs text-ink/55">результат</p>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
