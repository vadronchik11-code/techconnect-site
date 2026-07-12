import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-cream/20 lg:grid lg:grid-cols-[264px_1fr]">
      <div className="border-b border-ink/[0.06] bg-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <AdminSidebar user={user} />
      </div>
      <div className="min-w-0 p-5 sm:p-8">{children}</div>
    </div>
  );
}
