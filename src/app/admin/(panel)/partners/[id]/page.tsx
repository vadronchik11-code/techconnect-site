import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdminHeader from '@/components/admin/AdminHeader';
import PartnerForm from '@/components/admin/PartnerForm';
import { updatePartner } from '@/lib/actions/partners';

export const dynamic = 'force-dynamic';

export default async function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const partner = await prisma.partner.findUnique({ where: { id } });
  if (!partner) notFound();

  const action = updatePartner.bind(null, id);

  return (
    <>
      <AdminHeader title="Редактирование партнёра" back={{ href: '/admin/partners', label: 'К списку партнёров' }} />
      <PartnerForm
        action={action}
        submitLabel="Сохранить"
        values={{
          name: partner.name,
          description: partner.description,
          help: partner.help,
          url: partner.url,
          logo: partner.logo,
          order: partner.order,
        }}
      />
    </>
  );
}
