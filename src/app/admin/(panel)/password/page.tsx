import AdminHeader from '@/components/admin/AdminHeader';
import SubmitButton from '@/components/admin/SubmitButton';
import { changePassword } from '@/lib/actions/account';

export const dynamic = 'force-dynamic';

const ERRORS: Record<string, string> = {
  short: 'Новый пароль должен быть не короче 6 символов.',
  mismatch: 'Новый пароль и повтор не совпадают.',
  wrong: 'Текущий пароль указан неверно.',
};

export default async function PasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;

  return (
    <>
      <AdminHeader title="Смена пароля" description="Пароль вашего аккаунта в панели управления." />

      {ok && (
        <div className="mb-6 max-w-md rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          ✓ Пароль изменён. Используйте новый пароль при следующем входе.
        </div>
      )}
      {error && ERRORS[error] && (
        <div className="mb-6 max-w-md rounded-xl bg-crimson/10 px-4 py-3 text-sm font-medium text-crimson">
          {ERRORS[error]}
        </div>
      )}

      <form action={changePassword} className="card max-w-md space-y-4 p-6">
        <label className="block">
          <span className="tc-label">Текущий пароль</span>
          <input name="current" type="password" required autoComplete="current-password" className="tc-input" placeholder="••••••••" />
        </label>
        <label className="block">
          <span className="tc-label">Новый пароль</span>
          <input name="next" type="password" required minLength={6} autoComplete="new-password" className="tc-input" placeholder="минимум 6 символов" />
        </label>
        <label className="block">
          <span className="tc-label">Повторите новый пароль</span>
          <input name="repeat" type="password" required minLength={6} autoComplete="new-password" className="tc-input" placeholder="ещё раз" />
        </label>
        <SubmitButton label="Сменить пароль" />
      </form>
    </>
  );
}
