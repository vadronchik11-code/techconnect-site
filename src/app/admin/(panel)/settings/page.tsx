import AdminHeader from '@/components/admin/AdminHeader';
import SubmitButton from '@/components/admin/SubmitButton';
import { getSettings } from '@/lib/settings';
import { saveSettings } from '@/lib/actions/settings';

export const dynamic = 'force-dynamic';

const LEAD_SLOTS = 8;

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const s = await getSettings();
  const leads = [...s.leadership, ...Array(LEAD_SLOTS).fill(null)].slice(0, LEAD_SLOTS);

  return (
    <>
      <AdminHeader title="Настройки сайта" description="Соцсети, статистика, текст «о проекте» и руководство. Меняются сразу на сайте." />

      {saved && (
        <div className="mb-6 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          ✓ Настройки сохранены.
        </div>
      )}

      <form action={saveSettings} className="space-y-6">
        <div className="card space-y-5 p-6">
          <h2 className="text-lg font-extrabold text-ink">Контакты и соцсети</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="tc-label">Telegram (ссылка)</span>
              <input name="telegram" defaultValue={s.telegram} className="tc-input" placeholder="https://t.me/…" />
            </label>
            <label className="block">
              <span className="tc-label">ВКонтакте (ссылка)</span>
              <input name="vk" defaultValue={s.vk} className="tc-input" placeholder="https://vk.com/…" />
            </label>
            <label className="block">
              <span className="tc-label">Email</span>
              <input name="email" defaultValue={s.email} className="tc-input" placeholder="hello@…" />
            </label>
            <label className="block">
              <span className="tc-label">Адрес</span>
              <input name="address" defaultValue={s.address} className="tc-input" placeholder="ЮУрГУ, Челябинск" />
            </label>
          </div>
        </div>

        <div className="card space-y-5 p-6">
          <h2 className="text-lg font-extrabold text-ink">Главная страница</h2>
          <label className="block">
            <span className="tc-label">Счётчик «участников» (в шапке главной)</span>
            <input name="statParticipants" defaultValue={s.statParticipants} className="tc-input sm:max-w-[200px]" placeholder="600+" />
            <span className="mt-1 block text-xs text-ink/45">
              Мероприятия и партнёры считаются автоматически. Здесь — только число участников.
            </span>
          </label>
          <label className="block">
            <span className="tc-label">Текст «О проекте»</span>
            <textarea name="aboutText" rows={3} defaultValue={s.aboutText} className="tc-input resize-none" />
          </label>
        </div>

        <div className="card space-y-4 p-6">
          <div>
            <h2 className="text-lg font-extrabold text-ink">Руководство проекта</h2>
            <p className="text-sm text-ink/50">
              Заполните нужные строки. Пустые не показываются. Ссылки на TG/ВК необязательны — если нет,
              просто оставьте поле пустым.
            </p>
          </div>
          <div className="space-y-3">
            {leads.map((lead, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-ink/[0.08] p-3 sm:grid-cols-4">
                <input name={`lead_name_${i}`} defaultValue={lead?.name ?? ''} className="tc-input" placeholder="Имя" />
                <input name={`lead_role_${i}`} defaultValue={lead?.role ?? ''} className="tc-input" placeholder="Роль (например, руководитель)" />
                <input name={`lead_tg_${i}`} defaultValue={lead?.tg ?? ''} className="tc-input" placeholder="Ссылка TG (необязательно)" />
                <input name={`lead_vk_${i}`} defaultValue={lead?.vk ?? ''} className="tc-input" placeholder="Ссылка ВК (необязательно)" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <SubmitButton label="Сохранить настройки" />
        </div>
      </form>
    </>
  );
}
