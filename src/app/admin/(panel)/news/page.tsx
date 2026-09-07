import AdminHeader from '@/components/admin/AdminHeader';
import GazetteAdminShell from '@/components/admin/gazette/GazetteAdminShell';
import { getAllGazettePages } from '@/lib/newspaper';

export const dynamic = 'force-dynamic';

export default async function AdminNewsPage() {
  const pages = await getAllGazettePages();

  return (
    <>
      <AdminHeader
        title="Новости"
        description="Многостраничная газета — свободный холст с блоками на каждой странице. Переключайтесь между страницами слева, перетаскивайте их, чтобы менять порядок, и создавайте новые."
      />
      <GazetteAdminShell pages={pages} />
    </>
  );
}
