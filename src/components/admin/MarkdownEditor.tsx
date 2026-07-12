'use client';

import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ImagePlus } from 'lucide-react';

interface Props {
  name: string;
  defaultValue?: string;
  label?: string;
}

export default function MarkdownEditor({ name, defaultValue = '', label = 'Текст (Markdown)' }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function insertAtCursor(snippet: string) {
    const el = textareaRef.current;
    if (!el) {
      setValue((v) => v + snippet);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + snippet + value.slice(end);
    setValue(next);
    // restore focus + caret after the inserted snippet, once React re-renders
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again later
    if (!file) return;

    setUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Ошибка загрузки');
      const alt = file.name.replace(/\.[^.]+$/, '') || 'Фото';
      insertAtCursor(`\n![${alt}](${body.url})\n`);
      setTab('write');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <span className="tc-label mb-0">{label}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-crimson transition-colors hover:bg-cream disabled:opacity-50"
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
            {uploading ? 'Загрузка…' : 'Вставить фото'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />

          <div className="flex gap-1 rounded-lg bg-cream/60 p-1 text-sm">
            <button
              type="button"
              onClick={() => setTab('write')}
              className={`rounded-md px-3 py-1 font-medium ${tab === 'write' ? 'bg-white text-crimson shadow-sm' : 'text-ink/50'}`}
            >
              Написать
            </button>
            <button
              type="button"
              onClick={() => setTab('preview')}
              className={`rounded-md px-3 py-1 font-medium ${tab === 'preview' ? 'bg-white text-crimson shadow-sm' : 'text-ink/50'}`}
            >
              Превью
            </button>
          </div>
        </div>
      </div>

      {uploadError && <p className="mb-2 text-sm text-crimson">{uploadError}</p>}

      {tab === 'write' ? (
        <textarea
          ref={textareaRef}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={16}
          className="tc-input font-mono text-sm leading-relaxed"
          placeholder="## Заголовок&#10;&#10;Текст новости в **Markdown**. Поддерживаются списки, ссылки, цитаты и картинки."
        />
      ) : (
        <>
          <input type="hidden" name={name} value={value} />
          <div className="prose-tc min-h-[16rem] rounded-xl border border-ink/10 bg-white p-5">
            {value.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <p className="text-ink/40">Нечего показывать — напишите текст.</p>
            )}
          </div>
        </>
      )}
      <details className="mt-2 rounded-xl border border-ink/10 bg-cream/30 p-3 text-sm">
        <summary className="cursor-pointer font-semibold text-crimson">📖 Как оформлять текст (Markdown) — подсказка</summary>
        <div className="mt-3 space-y-3 text-ink/70">
          <p>Markdown — это простой способ форматировать текст обычными символами. Пишете слева — на сайте получается справа.</p>
          <MdRow code={'## Большой заголовок\n### Заголовок поменьше'} desc="Заголовки. # — самый крупный, чем больше решёток, тем мельче. Ставьте пробел после решёток." />
          <MdRow code={'**жирный текст**\n*курсив*'} desc="Выделение: две звёздочки — жирный, одна — курсив." />
          <MdRow code={'- первый пункт\n- второй пункт\n- третий пункт'} desc="Маркированный список — дефис и пробел в начале строки." />
          <MdRow code={'1. шаг один\n2. шаг два\n3. шаг три'} desc="Нумерованный список — цифра с точкой." />
          <MdRow code={'[Записаться на хакатон](https://t.me/susu_techconnect)'} desc="Ссылка: [текст ссылки](адрес). Текст — в квадратных скобках, адрес — в круглых." />
          <MdRow code={'![Фото с митапа](https://site.ru/photo.jpg)'} desc="Картинка: как ссылка, но с ! в начале. Проще всего — нажать «Вставить фото» выше, адрес подставится сам." />
          <MdRow code={'> Это цитата или важная мысль'} desc="Цитата — строка начинается с > и пробела. Выделится оранжевой плашкой." />
          <MdRow code={'Обычный текст.\n\nПустая строка = новый абзац.'} desc="Чтобы начать новый абзац, оставьте между строками пустую строку." />
          <MdRow code={'---'} desc="Три дефиса — горизонтальная разделительная линия." />
          <p className="text-xs text-ink/50">
            Не уверены, как получится? Нажмите вкладку <b>«Превью»</b> сверху — увидите, как текст будет выглядеть на сайте.
          </p>
        </div>
      </details>
    </div>
  );
}

function MdRow({ code, desc }: { code: string; desc: string }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-white p-2.5 font-mono text-xs text-crimson ring-1 ring-ink/10">{code}</pre>
      <p className="text-xs text-ink/60">{desc}</p>
    </div>
  );
}
