import Link from 'next/link';
import ImageUpload from './ImageUpload';
import SubmitButton from './SubmitButton';

interface PartnerValues {
  name?: string;
  description?: string;
  help?: string;
  url?: string | null;
  logo?: string | null;
  order?: number;
}

export default function PartnerForm({
  action,
  values = {},
  submitLabel = 'Сохранить',
}: {
  action: (formData: FormData) => void | Promise<void>;
  values?: PartnerValues;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="card space-y-5 p-6">
        <label className="block">
          <span className="tc-label">Название *</span>
          <input name="name" required defaultValue={values.name} className="tc-input" placeholder="Название компании" />
        </label>
        <label className="block">
          <span className="tc-label">Описание</span>
          <textarea name="description" rows={3} defaultValue={values.description} className="tc-input resize-none" placeholder="Чем занимается партнёр" />
        </label>
        <label className="block">
          <span className="tc-label">Чем помогает объединению</span>
          <textarea name="help" rows={2} defaultValue={values.help} className="tc-input resize-none" placeholder="Менторы, стажировки, площадки…" />
        </label>
        <label className="block">
          <span className="tc-label">Ссылка на сайт</span>
          <input name="url" defaultValue={values.url ?? ''} className="tc-input" placeholder="https://…" />
        </label>
      </div>

      <div className="space-y-6">
        <div className="card space-y-5 p-6">
          <ImageUpload name="logo" defaultValue={values.logo} label="Логотип" />
          <label className="block">
            <span className="tc-label">Порядок</span>
            <input type="number" name="order" defaultValue={values.order ?? 0} className="tc-input" />
          </label>
          <SubmitButton label={submitLabel} />
        </div>
        <Link href="/admin/partners" className="block text-center text-sm text-ink/50 hover:text-flame">
          Отмена
        </Link>
      </div>
    </form>
  );
}
