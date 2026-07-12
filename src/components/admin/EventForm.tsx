import Link from 'next/link';
import ImageUpload from './ImageUpload';
import SubmitButton from './SubmitButton';
import { EVENT_TYPES, EVENT_STATUS } from '@/lib/constants';

interface EventValues {
  title?: string;
  type?: string;
  status?: string;
  description?: string;
  location?: string | null;
  date?: string; // yyyy-MM-ddTHH:mm
  registrationUrl?: string | null;
  coverImage?: string | null;
  order?: number;
  isFinal?: boolean;
}

export default function EventForm({
  action,
  values = {},
  submitLabel = 'Сохранить',
}: {
  action: (formData: FormData) => void | Promise<void>;
  values?: EventValues;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="card space-y-5 p-6">
        <label className="block">
          <span className="tc-label">Название *</span>
          <input name="title" required defaultValue={values.title} className="tc-input" placeholder="Название мероприятия" />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="tc-label">Тип</span>
            <select name="type" defaultValue={values.type ?? 'MEETUP'} className="tc-input">
              {Object.entries(EVENT_TYPES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.emoji} {v.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="tc-label">Статус</span>
            <select name="status" defaultValue={values.status ?? 'UPCOMING'} className="tc-input">
              {Object.entries(EVENT_STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="tc-label">Описание</span>
          <textarea name="description" rows={4} defaultValue={values.description} className="tc-input resize-none" placeholder="О чём мероприятие" />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="tc-label">Дата и время</span>
            <input type="datetime-local" name="date" defaultValue={values.date} className="tc-input" />
          </label>
          <label className="block">
            <span className="tc-label">Место</span>
            <input name="location" defaultValue={values.location ?? ''} className="tc-input" placeholder="ЮУрГУ, ауд. 1001" />
          </label>
        </div>

        <label className="block">
          <span className="tc-label">Ссылка на регистрацию</span>
          <input name="registrationUrl" defaultValue={values.registrationUrl ?? ''} className="tc-input" placeholder="https://t.me/…" />
        </label>
      </div>

      <div className="space-y-6">
        <div className="card space-y-5 p-6">
          <ImageUpload name="coverImage" defaultValue={values.coverImage} label="Обложка" />
          <label className="block">
            <span className="tc-label">Порядок в дорожке</span>
            <input type="number" name="order" defaultValue={values.order ?? 0} className="tc-input" />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span>
              <span className="block font-semibold text-ink">Последнее мероприятие</span>
              <span className="text-xs text-ink/50">
                Дорожка закончится на нём. Если не отмечено ни одно — линия уходит в край (продолжение следует).
              </span>
            </span>
            <input type="checkbox" name="isFinal" defaultChecked={values.isFinal} className="h-6 w-6 shrink-0 accent-flame" />
          </label>
          <SubmitButton label={submitLabel} />
        </div>
        <Link href="/admin/events" className="block text-center text-sm text-ink/50 hover:text-flame">
          Отмена
        </Link>
      </div>
    </form>
  );
}
