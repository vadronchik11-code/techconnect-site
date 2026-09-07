'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Upload, Search, Check, Loader2 } from 'lucide-react';
import { uploadImages, type UploadedImage } from '@/lib/upload-client';
import { cn } from '@/lib/utils';

interface MediaItem {
  url: string;
  name: string;
  size: number;
  w: number;
  h: number;
}

interface Props {
  multiple?: boolean;
  onPick: (images: UploadedImage[]) => void;
  onClose: () => void;
}

/**
 * The photo library: everything already on disk, so the same shot can be
 * dropped into many blocks without re-uploading it, plus a dropzone that
 * accepts new files right here.
 */
export default function MediaPicker({ multiple = false, onPick, onClose }: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/media')
      .then((r) => r.json())
      .then((d) => {
        if (alive) setItems(d.items ?? []);
      })
      .catch(() => setError('Не удалось загрузить список фото'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function ingest(files: File[]) {
    const images = files.filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
    if (!images.length) return;
    setBusy(true);
    setError('');
    const uploaded = await uploadImages(images, undefined, (e) => setError(e.message));
    setBusy(false);
    if (!uploaded.length) return;
    // newly uploaded photos go to the front so they are immediately reusable
    setItems((prev) => [
      ...uploaded.map((u) => ({ url: u.url, name: u.url.split('/').pop() ?? '', size: 0, w: u.w ?? 0, h: u.h ?? 0 })),
      ...prev,
    ]);
    if (multiple) setSelected((prev) => [...prev, ...uploaded.map((u) => u.url)]);
    else onPick(uploaded.slice(0, 1));
  }

  function toggle(url: string) {
    if (!multiple) {
      const it = items.find((i) => i.url === url);
      onPick([{ url, w: it?.w || undefined, h: it?.h || undefined }]);
      return;
    }
    setSelected((prev) => (prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]));
  }

  function confirm() {
    const picked = selected
      .map((url) => items.find((i) => i.url === url))
      .filter(Boolean)
      .map((i) => ({ url: i!.url, w: i!.w || undefined, h: i!.h || undefined }));
    onPick(picked);
  }

  const shown = query.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  return (
    <div className="fixed inset-0 z-[10050] grid place-items-center bg-ink/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Выбор фото"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3.5">
          <h3 className="font-display text-lg font-extrabold text-ink">Фотографии</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink/40 hover:bg-cream hover:text-ink"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-3 px-5 pt-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void ingest(Array.from(e.dataTransfer.files));
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 text-sm font-semibold transition-colors',
              dragging ? 'border-flame bg-cream/60 text-crimson' : 'border-ink/15 text-ink/50 hover:border-flame/50'
            )}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Загружаем…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" aria-hidden /> Перетащите фото сюда или нажмите
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = '';
                void ingest(files);
              }}
            />
          </div>

          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по названию файла"
              className="tc-input !py-2 pl-9 text-sm"
            />
          </label>

          {error && <p className="text-sm font-medium text-crimson">{error}</p>}
        </div>

        <div className="tc-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-ink/40">Загружаем…</p>
          ) : shown.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink/40">
              {items.length === 0 ? 'Пока нет ни одного фото — загрузите первое.' : 'Ничего не найдено'}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {shown.map((item) => {
                const on = selected.includes(item.url);
                return (
                  <button
                    key={item.url}
                    type="button"
                    onClick={() => toggle(item.url)}
                    className={cn(
                      'group relative aspect-square overflow-hidden rounded-lg border-2 transition-all',
                      on ? 'border-flame ring-2 ring-flame/30' : 'border-transparent hover:border-ink/20'
                    )}
                    title={`${item.name}${item.w ? ` · ${item.w}×${item.h}` : ''}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    {on && (
                      <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-flame text-white">
                        <Check className="h-3 w-3" aria-hidden />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {multiple && (
          <div className="flex items-center justify-between border-t border-ink/10 px-5 py-3">
            <span className="text-sm text-ink/50">Выбрано: {selected.length}</span>
            <button
              type="button"
              onClick={confirm}
              disabled={selected.length === 0}
              className="btn-primary !py-2 text-sm disabled:opacity-40"
            >
              Вставить ({selected.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
