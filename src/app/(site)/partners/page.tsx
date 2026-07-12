import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import PageHeader from '@/components/PageHeader';
import { SITE } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Партнёры' };

export default async function PartnersPage() {
  const partners = await prisma.partner.findMany({ orderBy: { order: 'asc' } });

  return (
    <>
      <PageHeader
        plate="Кто с нами"
        title="Партнёры"
        description={`Компании и организации, которые помогают ${SITE.name} проводить мероприятия, давать практику и трудоустраивать участников.`}
        seed={41}
      />

      <div className="section">
        <div className="container-tc">
          {partners.length === 0 ? (
            <p className="rounded-xl border-2 border-dashed border-ink/15 bg-cream/30 py-16 text-center text-ink/55">
              Список партнёров скоро появится.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {partners.map((p) => (
                <article key={p.id} className="card flex gap-5 p-7">
                  <div className="shrink-0">
                    {p.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.logo} alt={p.name} className="h-16 w-16 rounded-lg object-contain" />
                    ) : (
                      <div className="grid h-16 w-16 -skew-x-[8deg] place-items-center rounded-lg bg-flame-gradient">
                        <span className="skew-x-[8deg] text-2xl font-black text-white">{p.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-extrabold text-ink">{p.name}</h3>
                      {p.url && (
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-flame hover:text-crimson" aria-label={`Сайт ${p.name}`}>
                          ↗
                        </a>
                      )}
                    </div>
                    {p.description && <p className="mt-2 text-ink/65">{p.description}</p>}
                    {p.help && (
                      <p className="mt-3 rounded-lg bg-cream/70 px-4 py-2.5 text-sm text-crimson">
                        <span className="font-bold">Чем помогает:</span> {p.help}
                      </p>
                    )}
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
