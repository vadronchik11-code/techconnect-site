'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { MDXEditorMethods } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

interface Props {
  /** Uncontrolled/native-form mode: renders a hidden <input name> for submission. */
  name?: string;
  defaultValue?: string;
  /** Controlled mode (e.g. inside a non-form panel): pass both, omit `name`. */
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
}

// MDXEditor (Lexical-based) touches browser APIs at module scope, so it must
// never run during SSR — load it client-side only, after this component (which
// is already 'use client') has mounted.
const Editor = dynamic(() => import('./RichMarkdownEditor'), {
  ssr: false,
  loading: () => <div className="tc-input h-[24rem] animate-pulse bg-cream/40" />,
});

export default function MarkdownEditor({ name, defaultValue = '', value, onChange, label = 'Текст' }: Props) {
  const controlled = value !== undefined && onChange !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const current = controlled ? value! : internal;
  const setCurrent = controlled ? onChange! : setInternal;

  const [tab, setTab] = useState<'write' | 'preview'>('write');

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <span className="tc-label mb-0">{label}</span>
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
            Как на сайте
          </button>
        </div>
      </div>

      {/* the form field: MDXEditor is a controlled rich-text view, not a native
          input, so its value is always mirrored here (uncontrolled/name mode only) */}
      {name && <input type="hidden" name={name} value={current} />}

      <div className={tab === 'write' ? '' : 'hidden'}>
        <Editor markdown={current} onChange={setCurrent} placeholder="Заголовок, текст, фото — оформляйте кнопками на панели сверху." />
      </div>

      {tab === 'preview' && (
        <div className="prose-tc min-h-[16rem] rounded-xl border border-ink/10 bg-white p-5">
          {current.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{current}</ReactMarkdown>
          ) : (
            <p className="text-ink/40">Нечего показывать — напишите текст.</p>
          )}
        </div>
      )}

      <p className="mt-2 text-xs text-ink/45">
        Оформляйте текст кнопками на панели: жирный, курсив, заголовки, списки, ссылка, фото, таблица, код. Вкладка{' '}
        <b>«Как на сайте»</b> показывает точный вид на сайте.
      </p>
    </div>
  );
}

export type { MDXEditorMethods };
