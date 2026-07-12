import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdminHeader from '@/components/admin/AdminHeader';
import PortfolioForm from '@/components/admin/PortfolioForm';
import { updatePortfolio } from '@/lib/actions/portfolio';

export const dynamic = 'force-dynamic';

export default async function EditPortfolioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.portfolioItem.findUnique({ where: { id } });
  if (!item) notFound();

  const action = updatePortfolio.bind(null, id);

  return (
    <>
      <AdminHeader title="Редактирование кейса" back={{ href: '/admin/portfolio', label: 'К списку кейсов' }} />
      <PortfolioForm
        action={action}
        submitLabel="Сохранить"
        values={{
          title: item.title,
          description: item.description,
          coverImage: item.coverImage,
          participants: item.participants,
          partnersCount: item.partnersCount,
          resultText: item.resultText,
          date: item.date ? item.date.toISOString().slice(0, 10) : undefined,
          order: item.order,
        }}
      />
    </>
  );
}
