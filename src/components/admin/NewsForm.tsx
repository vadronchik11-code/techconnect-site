import ImageUpload from './ImageUpload';
import MarkdownEditor from './MarkdownEditor';
import SubmitButton from './SubmitButton';
import Link from 'next/link';

interface NewsValues {
  title?: string;
  slug?: string;
  excerpt?: string;
  tags?: string;
  coverImage?: string | null;
  contentMd?: string;
  published?: boolean;
}

export default function NewsForm({
  action,
  values = {},
  submitLabel = 'Сохранить',
}: {
  action: (formData: FormData) => void | Promise<void>;
  values?: NewsValues;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="card space-y-5 p-6">
        <label className="block">
          <span className="tc-label">Заголовок *</span>
          <input name="title" required defaultValue={values.title} className="tc-input" placeholder="Заголовок новости" />
        </label>
        <label className="block">
          <span className="tc-label">Краткое описание</span>
          <textarea name="excerpt" rows={2} defaultValue={values.excerpt} className="tc-input resize-none" placeholder="Короткий анонс для карточки" />
        </label>
        <MarkdownEditor name="contentMd" defaultValue={values.contentMd ?? ''} />
      </div>

      <div className="space-y-6">
        <div className="card space-y-5 p-6">
          <label className="flex items-center justify-between gap-3">
            <span>
              <span className="block font-semibold text-ink">Опубликовать</span>
              <span className="text-xs text-ink/50">Виден на сайте</span>
            </span>
            <input
              type="checkbox"
              name="published"
              defaultChecked={values.published}
              className="h-6 w-6 accent-flame"
            />
          </label>
          <SubmitButton label={submitLabel} />
        </div>

        <div className="card space-y-5 p-6">
          <ImageUpload name="coverImage" defaultValue={values.coverImage} label="Обложка" />
          <label className="block">
            <span className="tc-label">Теги (через запятую)</span>
            <input name="tags" defaultValue={values.tags} className="tc-input" placeholder="анонс, хакатон" />
          </label>
          <label className="block">
            <span className="tc-label">URL (slug)</span>
            <input name="slug" defaultValue={values.slug} className="tc-input" placeholder="оставьте пустым для авто" />
          </label>
        </div>

        <Link href="/admin/news" className="block text-center text-sm text-ink/50 hover:text-flame">
          Отмена
        </Link>
      </div>
    </form>
  );
}
