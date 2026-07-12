import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import AdminHeader from '@/components/admin/AdminHeader';
import DeleteButton from '@/components/admin/DeleteButton';
import SortableAdminList from '@/components/admin/SortableAdminList';
import { deletePartner, reorderPartners } from '@/lib/actions/partners';

export const dynamic = 'force-dynamic';

export default async function AdminPartnersList() {
  const partners = await prisma.partner.findMany({ orderBy: { order: 'asc' } });

  return (
    <>
      <AdminHeader title="Партнёры" description="Организации, которые помогают объединению. Перетащите, чтобы изменить порядок." action={{ href: '/admin/partners/new', label: '+ Партнёр' }} />

      {partners.length === 0 ? (
        <div className="card grid place-items-center p-16 text-center text-ink/50">
          <p>Партнёров пока нет.</p>
          <Link href="/admin/partners/new" className="btn-primary mt-4">Добавить первого</Link>
        </div>
      ) : (
        <SortableAdminList
          onReorder={reorderPartners}
          items={partners.map((p) => ({
            id: p.id,
            content: (
              <>
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-flame-gradient text-white">
                  {p.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.logo} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <span className="font-black">{p.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{p.name}</p>
                  <p className="truncate text-sm text-ink/50">{p.help || p.description || '—'}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Link href={`/admin/partners/${p.id}`} className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink/70 hover:bg-cream">
                    Изменить
                  </Link>
                  <DeleteButton action={deletePartner} id={p.id} confirmText={`Удалить «${p.name}»?`} />
                </div>
              </>
            ),
          }))}
        />
      )}
    </>
  );
}
