'use client';

import { useState } from 'react';

interface Props {
  name: string;
  defaultValue?: string | null;
  label?: string;
}

export default function ImageUpload({ name, defaultValue, label = 'Изображение' }: Props) {
  const [url, setUrl] = useState(defaultValue ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Ошибка загрузки');
      setUrl(body.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <span className="tc-label">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-ink/10 bg-cream/40">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl text-ink/30">🖼️</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="btn-outline cursor-pointer !py-2 text-sm">
            {loading ? 'Загрузка…' : 'Загрузить файл'}
            <input type="file" accept="image/*" onChange={onFile} className="hidden" disabled={loading} />
          </label>
          {url && (
            <button type="button" onClick={() => setUrl('')} className="text-left text-xs text-crimson hover:underline">
              Удалить
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-crimson">{error}</p>}
    </div>
  );
}
