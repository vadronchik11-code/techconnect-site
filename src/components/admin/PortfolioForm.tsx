import Link from 'next/link';
import ImageUpload from './ImageUpload';
import SubmitButton from './SubmitButton';

interface PortfolioValues {
  title?: string;
  description?: string;
  coverImage?: string | null;
  participants?: number | null;
  partnersCount?: number | null;
  resultText?: string | null;
  date?: string; // yyyy-MM-dd
  order?: number;
}

export default function PortfolioForm({
  action,
  values = {},
  submitLabel = 'Сохранить',
}: {
  action: (formData: FormData) => void | Promise<void>;
  values?: PortfolioValues;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="card space-y-5 p-6">
        <label className="block">
          <span className="tc-label">Название *</span>
          <input name="title" required defaultValue={values.title} className="tc-input" placeholder="Название кейса" />
        </label>
        <label className="block">
          <span className="tc-label">Описание</span>
          <textarea name="description" rows={4} defaultValue={values.description} className="tc-input resize-none" placeholder="Что провели и как прошло" />
        </label>
        <div className="grid gap-5 sm:grid-cols-3">
          <label className="block">
            <span className="tc-label">Участников</span>
            <input type="number" name="participants" defaultValue={values.participants ?? ''} className="tc-input" placeholder="120" />
          </label>
          <label className="block">
            <span className="tc-label">Партнёров</span>
            <input type="number" name="partnersCount" defaultValue={values.partnersCount ?? ''} className="tc-input" placeholder="4" />
          </label>
          <label className="block">
            <span className="tc-label">Дата</span>
            <input type="date" name="date" defaultValue={values.date} className="tc-input" />
          </label>
        </div>
        <label className="block">
          <span className="tc-label">Результат</span>
          <input name="resultText" defaultValue={values.resultText ?? ''} className="tc-input" placeholder="5 участников получили офферы" />
        </label>
      </div>

      <div className="space-y-6">
        <div className="card space-y-5 p-6">
          <ImageUpload name="coverImage" defaultValue={values.coverImage} label="Обложка" />
          <label className="block">
            <span className="tc-label">Порядок</span>
            <input type="number" name="order" defaultValue={values.order ?? 0} className="tc-input" />
          </label>
          <SubmitButton label={submitLabel} />
        </div>
        <Link href="/admin/portfolio" className="block text-center text-sm text-ink/50 hover:text-flame">
          Отмена
        </Link>
      </div>
    </form>
  );
}
