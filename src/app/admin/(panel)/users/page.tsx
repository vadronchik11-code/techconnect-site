import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import AdminHeader from '@/components/admin/AdminHeader';
import DeleteButton from '@/components/admin/DeleteButton';
import ResetPasswordButton from '@/components/admin/ResetPasswordButton';
import SubmitButton from '@/components/admin/SubmitButton';
import { createUser, deleteUser } from '@/lib/actions/users';
import { resetUserPassword } from '@/lib/actions/account';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  if (session.role !== 'ADMIN') {
    return (
      <>
        <AdminHeader title="Пользователи" />
        <div className="card p-10 text-center text-ink/50">Доступно только администраторам.</div>
      </>
    );
  }

  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });

  return (
    <>
      <AdminHeader title="Пользователи" description="Администраторы и модераторы (сммщики)." />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="card divide-y divide-ink/[0.06] overflow-hidden">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-4 p-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-flame-gradient font-black text-white">
                {(u.name ?? u.email).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{u.name ?? u.email}</p>
                <p className="truncate text-sm text-ink/50">{u.email} · с {formatDate(u.createdAt, false)}</p>
              </div>
              <span className={`chip shrink-0 ${u.role === 'ADMIN' ? 'bg-flame text-white' : 'bg-cream text-crimson'}`}>
                {u.role === 'ADMIN' ? 'Администратор' : 'Модератор'}
              </span>
              <ResetPasswordButton action={resetUserPassword} id={u.id} name={u.name ?? u.email} />
              {u.id !== session.id && <DeleteButton action={deleteUser} id={u.id} confirmText={`Удалить пользователя ${u.email}?`} />}
            </div>
          ))}
        </div>

        <form action={createUser} className="card h-fit space-y-4 p-6">
          <h3 className="text-lg font-extrabold text-ink">Добавить пользователя</h3>
          <label className="block">
            <span className="tc-label">Имя</span>
            <input name="name" className="tc-input" placeholder="Имя" />
          </label>
          <label className="block">
            <span className="tc-label">Email *</span>
            <input name="email" type="email" required className="tc-input" placeholder="user@techconnect.ru" />
          </label>
          <label className="block">
            <span className="tc-label">Пароль *</span>
            <input name="password" type="text" required minLength={6} className="tc-input" placeholder="минимум 6 символов" />
          </label>
          <label className="block">
            <span className="tc-label">Роль</span>
            <select name="role" defaultValue="MODERATOR" className="tc-input">
              <option value="MODERATOR">Модератор (сммщик)</option>
              <option value="ADMIN">Администратор</option>
            </select>
          </label>
          <SubmitButton label="Создать" />
        </form>
      </div>
    </>
  );
}
