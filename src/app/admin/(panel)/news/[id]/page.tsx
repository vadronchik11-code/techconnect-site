import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdminHeader from '@/components/admin/AdminHeader';
import NewsForm from '@/components/admin/NewsForm';
import { updateNews } from '@/lib/actions/news';

export const dynamic = 'force-dynamic';

export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const news = await prisma.news.findUnique({ where: { id } });
  if (!news) notFound();

  const action = updateNews.bind(null, id);

  return (
    <>
      <AdminHeader title="Редактирование новости" back={{ href: '/admin/news', label: 'К списку новостей' }} />
      <NewsForm
        action={action}
        submitLabel="Сохранить"
        values={{
          title: news.title,
          slug: news.slug,
          excerpt: news.excerpt,
          tags: news.tags,
          coverImage: news.coverImage,
          contentMd: news.contentMd,
          published: news.published,
        }}
      />
    </>
  );
}
