import AdminHeader from '@/components/admin/AdminHeader';
import PortfolioForm from '@/components/admin/PortfolioForm';
import { createPortfolio } from '@/lib/actions/portfolio';

export default function NewPortfolioPage() {
  return (
    <>
      <AdminHeader title="Новый кейс" back={{ href: '/admin/portfolio', label: 'К списку кейсов' }} />
      <PortfolioForm action={createPortfolio} submitLabel="Создать" />
    </>
  );
}
