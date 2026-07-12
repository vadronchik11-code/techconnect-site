import AdminHeader from '@/components/admin/AdminHeader';
import NewsForm from '@/components/admin/NewsForm';
import { createNews } from '@/lib/actions/news';

export default function NewNewsPage() {
  return (
    <>
      <AdminHeader title="Новая новость" back={{ href: '/admin/news', label: 'К списку новостей' }} />
      <NewsForm action={createNews} submitLabel="Создать" />
    </>
  );
}
