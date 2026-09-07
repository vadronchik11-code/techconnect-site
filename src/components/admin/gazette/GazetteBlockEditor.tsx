'use client';

import { useState } from 'react';
import {
  Sun,
  Moon,
  Flame,
  ImagePlus,
  X,
  Trash2,
  Copy,
  Images,
  Maximize2,
  ChevronsUp,
  ChevronUp,
  ChevronDown,
  ChevronsDown,
  RotateCcw,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import MediaPicker from '@/components/admin/MediaPicker';
import { KIND_LABELS, KIND_DEFAULT_SIZE } from './blockPresets';
import { COL } from '@/lib/gazetteTemplates';
import { cn } from '@/lib/utils';
import type { EditableBlock } from './GazetteBuilder';
import type { BlockKind, ImageLayout } from '@/lib/newspaper';

interface Props {
  block: EditableBlock;
  onChange: (patch: Partial<EditableBlock>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onReorder: (dir: 'front' | 'back' | 'up' | 'down') => void;
  onClose: () => void;
}

type Tab = 'text' | 'photo' | 'look' | 'place';

const KIND_ORDER: BlockKind[] = ['content', 'headline', 'banner', 'gallery', 'quote', 'cover', 'accents'];

/** One table instead of scattered booleans — a field either does something for
 *  this kind or it is not shown at all. */
const FIELDS: Record<BlockKind, { text: boolean; photo: boolean; gallery: boolean; number: boolean; kicker: boolean; body: boolean }> = {
  content: { text: true, photo: true, gallery: false, number: true, kicker: true, body: true },
  headline: { text: true, photo: true, gallery: false, number: false, kicker: true, body: true },
  banner: { text: true, photo: false, gallery: false, number: false, kicker: false, body: false },
  gallery: { text: true, photo: false, gallery: true, number: false, kicker: false, body: false },
  cover: { text: true, photo: true, gallery: false, number: false, kicker: false, body: false },
  accents: { text: true, photo: false, gallery: false, number: false, kicker: false, body: true },
  quote: { text: true, photo: false, gallery: false, number: false, kicker: true, body: false },
};

const TITLE_LABEL: Record<BlockKind, string> = {
  content: 'Заголовок новости',
  headline: 'Крупный заголовок',
  banner: 'Текст баннера',
  gallery: 'Подпись над фото',
  cover: 'Заголовок обложки («|» — перенос строки)',
  accents: 'Название раздела',
  quote: 'Текст цитаты',
};

const LAYOUTS: { value: ImageLayout; label: string }[] = [
  { value: 'top', label: 'Сверху' },
  { value: 'bottom', label: 'Снизу' },
  { value: 'left', label: 'Слева' },
  { value: 'right', label: 'Справа' },
  { value: 'full', label: 'Во весь блок' },
];

export default function GazetteBlockEditor({ block, onChange, onDelete, onDuplicate, onReorder, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('text');
  const [picker, setPicker] = useState<null | 'single' | 'gallery'>(null);
  const [bigEditor, setBigEditor] = useState(false);

  const f = FIELDS[block.kind];

  function changeKind(kind: BlockKind) {
    const size = KIND_DEFAULT_SIZE[kind];
    const wasDefault =
      Math.abs(block.width - KIND_DEFAULT_SIZE[block.kind].width) < 4 &&
      Math.abs(block.height - KIND_DEFAULT_SIZE[block.kind].height) < 4;
    // Snap geometry to the new kind when the block is still at its canned size —
    // otherwise a 360×260 box turned into a banner becomes a broken tall bar.
    onChange(wasDefault ? { kind, ...size } : { kind });
  }

  function moveGalleryImage(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= block.images.length) return;
    const next = [...block.images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ images: next });
  }

  const TABS: { id: Tab; label: string; show: boolean }[] = [
    { id: 'text', label: 'Текст', show: true },
    { id: 'photo', label: 'Фото', show: f.photo || f.gallery },
    { id: 'look', label: 'Вид', show: true },
    { id: 'place', label: 'Место', show: true },
  ];
  const activeTab = TABS.find((t) => t.id === tab && t.show) ? tab : 'text';

  return (
    <div className="card flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-extrabold text-ink">{KIND_LABELS[block.kind]}</h3>
          <p className="truncate text-xs text-ink/40">{block.title || block.kicker || 'без названия'}</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onDuplicate}
            className="rounded-lg p-1.5 text-ink/40 hover:bg-cream hover:text-ink"
            aria-label="Дублировать блок"
            title="Дублировать (Ctrl+D)"
          >
            <Copy className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink/40 hover:bg-cream hover:text-ink"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex gap-0.5 border-b border-ink/10 px-2 pt-2">
        {TABS.filter((t) => t.show).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-t-lg px-3 py-1.5 text-sm font-semibold transition-colors',
              activeTab === t.id ? 'bg-cream text-crimson' : 'text-ink/45 hover:text-ink'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tc-scroll min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {/* ------------------------------ TEXT ------------------------------ */}
        {activeTab === 'text' && (
          <>
            <label className="block">
              <span className="tc-label">{TITLE_LABEL[block.kind]}</span>
              <input
                value={block.title}
                onChange={(e) => onChange({ title: e.target.value })}
                className="tc-input"
                placeholder={block.kind === 'banner' ? 'ДЕНЬ 1' : 'Заголовок'}
              />
            </label>

            {(f.number || f.kicker) && (
              <div className="grid grid-cols-2 gap-3">
                {f.number && (
                  <label className="block">
                    <span className="tc-label">Номер сюжета</span>
                    <input
                      value={block.number}
                      onChange={(e) => onChange({ number: e.target.value })}
                      className="tc-input"
                      placeholder="#1"
                    />
                    <span className="mt-1 block text-[11px] leading-tight text-ink/40">Чёрная плашка слева</span>
                  </label>
                )}
                {f.kicker && (
                  <label className={cn('block', !f.number && 'col-span-2')}>
                    <span className="tc-label">{block.kind === 'quote' ? 'Автор' : 'Категория'}</span>
                    <input
                      value={block.kicker}
                      onChange={(e) => onChange({ kicker: e.target.value })}
                      className="tc-input"
                      placeholder={block.kind === 'quote' ? 'Имя Фамилия' : 'ХАКАТОН'}
                    />
                    <span className="mt-1 block text-[11px] leading-tight text-ink/40">
                      {block.kind === 'quote' ? 'Подпись под цитатой' : 'Серая подпись справа'}
                    </span>
                  </label>
                )}
              </div>
            )}

            {f.body && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="tc-label !mb-0">
                    {block.kind === 'accents' ? 'Строки раздела' : 'Текст блока'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBigEditor(true)}
                    className="flex items-center gap-1 text-xs font-semibold text-flame hover:text-crimson"
                  >
                    <Maximize2 className="h-3 w-3" aria-hidden /> Развернуть
                  </button>
                </div>
                {block.kind === 'accents' && (
                  <p className="mb-1.5 text-[11px] leading-tight text-ink/45">
                    Каждая строка «## НАЗВАНИЕ» становится оранжевой полосой, текст под ней — абзацем.
                  </p>
                )}
                <textarea
                  value={block.contentMd}
                  onChange={(e) => onChange({ contentMd: e.target.value })}
                  rows={7}
                  className="tc-input font-mono text-[13px] leading-relaxed"
                  placeholder="Текст новости…"
                />
              </div>
            )}

            {!f.body && (
              <p className="rounded-lg bg-cream/50 px-3 py-2 text-xs text-ink/50">
                У блока «{KIND_LABELS[block.kind]}» нет основного текста — он показывает только заголовок.
              </p>
            )}
          </>
        )}

        {/* ------------------------------ PHOTO ----------------------------- */}
        {activeTab === 'photo' && f.photo && (
          <>
            {block.imageUrl ? (
              <div className="space-y-3">
                <div className="relative aspect-video overflow-hidden rounded-lg border border-ink/10 bg-cream/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={block.imageUrl}
                    alt=""
                    className="h-full w-full"
                    style={{
                      objectFit: block.imageFit === 'contain' ? 'contain' : 'cover',
                      objectPosition: `${block.imagePosX}% ${block.imagePosY}%`,
                      transform: `scale(${block.imageScale})`,
                      transformOrigin: `${block.imagePosX}% ${block.imagePosY}%`,
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPicker('single')} className="btn-outline flex-1 !py-2 text-sm">
                    <Images className="h-4 w-4" aria-hidden /> Заменить
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ imageUrl: null, imageW: null, imageH: null })}
                    className="rounded-lg px-3 text-sm font-semibold text-crimson hover:bg-crimson/10"
                  >
                    Убрать
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setPicker('single')} className="btn-outline w-full justify-center !py-2.5 text-sm">
                <ImagePlus className="h-4 w-4" aria-hidden /> Выбрать фото
              </button>
            )}

            {block.imageUrl && (
              <>
                {block.kind === 'content' && (
                  <div>
                    <span className="tc-label">Где фото</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {LAYOUTS.map((l) => (
                        <button
                          key={l.value}
                          type="button"
                          onClick={() => onChange({ imageLayout: l.value })}
                          className={cn(
                            'rounded-md border-2 py-1.5 text-xs font-semibold transition-colors',
                            block.imageLayout === l.value
                              ? 'border-flame bg-cream text-crimson'
                              : 'border-ink/10 text-ink/50 hover:border-ink/20'
                          )}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {block.imageLayout !== 'full' && (
                  <label className="block">
                    <span className="tc-label">Размер фото — {block.imageSpan}%</span>
                    <input
                      type="range"
                      min={15}
                      max={90}
                      value={block.imageSpan}
                      onChange={(e) => onChange({ imageSpan: Number(e.target.value) })}
                      className="w-full accent-flame"
                    />
                  </label>
                )}

                <div className="flex gap-2">
                  {(['cover', 'contain'] as const).map((fit) => (
                    <button
                      key={fit}
                      type="button"
                      onClick={() =>
                        onChange(
                          fit === 'contain'
                            ? { imageFit: fit, imageScale: 1, imagePosX: 50, imagePosY: 50 }
                            : { imageFit: fit }
                        )
                      }
                      className={cn(
                        'flex-1 rounded-md border py-1.5 text-xs font-semibold',
                        block.imageFit === fit ? 'border-flame bg-cream text-crimson' : 'border-ink/10 text-ink/50'
                      )}
                    >
                      {fit === 'cover' ? 'Обрезать' : 'Вписать целиком'}
                    </button>
                  ))}
                </div>

                <label className="block">
                  <span className="tc-label">Масштаб — {Math.round(block.imageScale * 100)}%</span>
                  <input
                    type="range"
                    min={block.imageFit === 'contain' ? 0.2 : 1}
                    max={4}
                    step={0.05}
                    value={block.imageScale}
                    onChange={(e) => onChange({ imageScale: Number(e.target.value) })}
                    className="w-full accent-flame"
                  />
                </label>

                {block.imageFit === 'cover' && (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs">
                      <span className="mb-1 block font-semibold text-ink/60">Сдвиг по горизонтали</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={block.imagePosX}
                        onChange={(e) => onChange({ imagePosX: Number(e.target.value) })}
                        className="w-full accent-flame"
                      />
                    </label>
                    <label className="block text-xs">
                      <span className="mb-1 block font-semibold text-ink/60">Сдвиг по вертикали</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={block.imagePosY}
                        onChange={(e) => onChange({ imagePosY: Number(e.target.value) })}
                        className="w-full accent-flame"
                      />
                    </label>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onChange({ imageScale: 1, imagePosX: 50, imagePosY: 50 })}
                  className="flex items-center gap-1.5 text-xs font-semibold text-ink/50 hover:text-crimson"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden /> Сбросить кадр
                </button>

                <label className="block">
                  <span className="tc-label">Описание фото</span>
                  <input
                    value={block.imageAlt}
                    onChange={(e) => onChange({ imageAlt: e.target.value })}
                    className="tc-input"
                    placeholder="Что на фото — для незрячих читателей"
                  />
                </label>
              </>
            )}
          </>
        )}

        {activeTab === 'photo' && f.gallery && (
          <>
            <button type="button" onClick={() => setPicker('gallery')} className="btn-outline w-full justify-center !py-2.5 text-sm">
              <ImagePlus className="h-4 w-4" aria-hidden /> Добавить фото
            </button>
            <p className="text-xs text-ink/45">
              Фотографии сами встанут в ряд и сохранят свои пропорции — вертикальные останутся
              вертикальными.
            </p>
            {block.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {block.images.map((img, i) => (
                  <div key={`${img.url}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border border-ink/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex justify-center gap-0.5 bg-ink/70 py-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => moveGalleryImage(i, -1)}
                        disabled={i === 0}
                        className="rounded p-0.5 text-white hover:bg-white/20 disabled:opacity-30"
                        aria-label="Раньше"
                      >
                        <ArrowUp className="h-3 w-3" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveGalleryImage(i, 1)}
                        disabled={i === block.images.length - 1}
                        className="rounded p-0.5 text-white hover:bg-white/20 disabled:opacity-30"
                        aria-label="Позже"
                      >
                        <ArrowDown className="h-3 w-3" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => onChange({ images: block.images.filter((_, j) => j !== i) })}
                        className="rounded p-0.5 text-white hover:bg-white/20"
                        aria-label="Удалить"
                      >
                        <Trash2 className="h-3 w-3" aria-hidden />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ------------------------------ LOOK ------------------------------ */}
        {activeTab === 'look' && (
          <>
            <div>
              <span className="tc-label">Тип блока</span>
              <div className="grid grid-cols-2 gap-2">
                {KIND_ORDER.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => changeKind(k)}
                    className={cn(
                      'rounded-lg border-2 py-2 text-xs font-semibold transition-colors',
                      block.kind === k ? 'border-flame bg-cream text-crimson' : 'border-ink/10 text-ink/50 hover:border-ink/20'
                    )}
                  >
                    {KIND_LABELS[k]}
                  </button>
                ))}
              </div>
            </div>

            {block.kind !== 'banner' && block.kind !== 'cover' && (
              <div>
                <span className="tc-label">Цвет плашки</span>
                <div className="flex gap-2">
                  {(
                    [
                      { v: 'light', label: 'Белый', Icon: Sun, cls: 'border-flame bg-cream text-crimson' },
                      { v: 'dark', label: 'Чёрный', Icon: Moon, cls: 'border-ink bg-ink text-cream' },
                      { v: 'flame', label: 'Оранжевый', Icon: Flame, cls: 'border-flame bg-flame text-white' },
                    ] as const
                  ).map(({ v, label, Icon, cls }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onChange({ tone: v })}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 py-2 text-xs font-semibold transition-colors',
                        block.tone === v ? cls : 'border-ink/10 text-ink/50 hover:border-ink/20'
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden /> {label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] leading-tight text-ink/45">
                  Белый — текст прямо на бумаге. Чёрный и оранжевый — плашка с фирменной тенью.
                </p>
              </div>
            )}
          </>
        )}

        {/* ------------------------------ PLACE ----------------------------- */}
        {activeTab === 'place' && (
          <>
            <div>
              <span className="tc-label">Ширина по колонкам</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ x: COL.full.x, width: COL.full.width })}
                  className="rounded-lg border-2 border-ink/10 py-2 text-xs font-semibold text-ink/60 hover:border-flame hover:text-crimson"
                >
                  Во всю ширину
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ x: COL.halfL.x, width: COL.halfL.width })}
                  className="rounded-lg border-2 border-ink/10 py-2 text-xs font-semibold text-ink/60 hover:border-flame hover:text-crimson"
                >
                  Половина слева
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ x: COL.halfR.x, width: COL.halfR.width })}
                  className="rounded-lg border-2 border-ink/10 py-2 text-xs font-semibold text-ink/60 hover:border-flame hover:text-crimson"
                >
                  Половина справа
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ x: COL.third.x, width: COL.third.width })}
                  className="rounded-lg border-2 border-ink/10 py-2 text-xs font-semibold text-ink/60 hover:border-flame hover:text-crimson"
                >
                  Узкая колонка
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ['x', 'Слева, px'],
                  ['y', 'Сверху, px'],
                  ['width', 'Ширина, px'],
                  ['height', 'Высота, px'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block">
                  <span className="tc-label">{label}</span>
                  <input
                    type="number"
                    value={block[key]}
                    onChange={(e) => onChange({ [key]: Math.max(0, Number(e.target.value) || 0) } as Partial<EditableBlock>)}
                    className="tc-input !py-2 text-sm"
                  />
                </label>
              ))}
            </div>

            <div>
              <span className="tc-label">Слой</span>
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    ['front', 'На самый верх', ChevronsUp],
                    ['up', 'Выше', ChevronUp],
                    ['down', 'Ниже', ChevronDown],
                    ['back', 'В самый низ', ChevronsDown],
                  ] as const
                ).map(([dir, title, Icon]) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => onReorder(dir)}
                    title={title}
                    className="grid place-items-center rounded-lg border-2 border-ink/10 py-2 text-ink/50 hover:border-flame hover:text-crimson"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-ink/10 p-3">
        <button
          type="button"
          onClick={onDelete}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-crimson hover:bg-crimson/10"
        >
          <Trash2 className="h-4 w-4" aria-hidden /> Удалить блок
        </button>
      </div>

      {picker && (
        <MediaPicker
          multiple={picker === 'gallery'}
          onClose={() => setPicker(null)}
          onPick={(imgs) => {
            if (picker === 'gallery') onChange({ images: [...block.images, ...imgs] });
            else if (imgs[0])
              onChange({
                imageUrl: imgs[0].url,
                imageW: imgs[0].w ?? null,
                imageH: imgs[0].h ?? null,
                imageScale: 1,
                imagePosX: 50,
                imagePosY: 50,
              });
            setPicker(null);
          }}
        />
      )}

      {bigEditor && (
        <div className="fixed inset-0 z-[10050] grid place-items-center bg-ink/60 p-4" onClick={() => setBigEditor(false)}>
          <div
            className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3">
              <h3 className="font-display text-lg font-extrabold text-ink">Текст блока</h3>
              <button
                type="button"
                onClick={() => setBigEditor(false)}
                className="rounded-lg p-1.5 text-ink/40 hover:bg-cream hover:text-ink"
                aria-label="Закрыть"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="tc-scroll min-h-0 flex-1 overflow-y-auto p-5">
              <MarkdownEditor value={block.contentMd} onChange={(v) => onChange({ contentMd: v })} />
            </div>
            <div className="flex justify-end border-t border-ink/10 px-5 py-3">
              <button type="button" onClick={() => setBigEditor(false)} className="btn-primary !py-2 text-sm">
                Готово
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
