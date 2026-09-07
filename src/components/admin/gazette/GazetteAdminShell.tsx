'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Copy, GripVertical } from 'lucide-react';
import GazetteBuilder, { type EditableBlock } from './GazetteBuilder';
import GazetteBlockContent from '@/components/gazette/GazetteBlockContent';
import { gazetteGuard } from './gazetteGuard';
import {
  createGazettePage,
  deleteGazettePage,
  duplicateGazettePage,
  reorderGazettePages,
} from '@/lib/actions/newspaper';
import { TEMPLATES, TEMPLATE_LABELS, type TemplateId } from '@/lib/gazetteTemplates';
import { formatDate, cn } from '@/lib/utils';
import type { GazettePageData } from '@/lib/newspaper';

interface Props {
  pages: GazettePageData[];
}

function toEditableBlocks(page: GazettePageData): EditableBlock[] {
  return page.blocks.map((b) => ({
    id: b.id,
    x: b.x,
    y: b.y,
    width: b.width,
    height: b.height,
    zIndex: b.zIndex,
    tone: b.tone,
    kind: b.kind,
    number: b.number,
    kicker: b.kicker,
    title: b.title,
    contentMd: b.contentMd,
    imageUrl: b.imageUrl,
    imageFit: b.imageFit,
    imageScale: b.imageScale,
    imagePosX: b.imagePosX,
    imagePosY: b.imagePosY,
    imageW: b.imageW,
    imageH: b.imageH,
    imageLayout: b.imageLayout,
    imageSpan: b.imageSpan,
    imageAlt: b.imageAlt,
    images: b.images,
  }));
}

const TEMPLATE_IDS: TemplateId[] = ['cover', 'standard', 'photo', 'text', 'blank'];

export default function GazetteAdminShell({ pages }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(pages[pages.length - 1]?.id ?? null);
  const [showCreate, setShowCreate] = useState(false);
  const [newIssue, setNewIssue] = useState(Math.max(...pages.map((p) => p.issueNumber), 0) || 1);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pendingSwitch, setPendingSwitch] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<GazettePageData | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = pages.find((p) => p.id === selectedId) ?? null;

  /** Never switch away from unsaved work without asking. */
  function requestSelect(id: string) {
    if (id === selectedId) return;
    if (!gazetteGuard.isDirty()) return setSelectedId(id);
    setPendingSwitch(id);
  }

  function create(template: TemplateId) {
    setShowCreate(false);
    startTransition(async () => {
      const id = await createGazettePage(newIssue, new Date(newDate), template);
      setSelectedId(id);
      router.refresh();
    });
  }

  function doDelete(page: GazettePageData) {
    setConfirmDelete(null);
    startTransition(async () => {
      await deleteGazettePage(page.id);
      if (selectedId === page.id) {
        const idx = pages.findIndex((p) => p.id === page.id);
        setSelectedId(pages[idx - 1]?.id ?? pages[idx + 1]?.id ?? null);
      }
      router.refresh();
    });
  }

  function duplicate(id: string) {
    startTransition(async () => {
      const copy = await duplicateGazettePage(id);
      setSelectedId(copy);
      router.refresh();
    });
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return setDragId(null);
    const order = pages.map((p) => p.id);
    const from = order.indexOf(dragId);
    const to = order.indexOf(targetId);
    order.splice(to, 0, ...order.splice(from, 1));
    setDragId(null);
    startTransition(async () => {
      await reorderGazettePages(order);
      router.refresh();
    });
  }

  // pages grouped by issue, preserving order
  const groups: { issue: number; date: Date; items: GazettePageData[] }[] = [];
  for (const p of pages) {
    const last = groups[groups.length - 1];
    if (last && last.issue === p.issueNumber) last.items.push(p);
    else groups.push({ issue: p.issueNumber, date: p.issueDate, items: [p] });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[248px_1fr]">
      {/* ------------------------------ sidebar ------------------------------ */}
      <div className="space-y-3">
        <button type="button" onClick={() => setShowCreate(true)} className="btn-primary w-full !py-2.5 text-sm">
          <Plus className="h-4 w-4" aria-hidden /> Новая страница
        </button>

        {groups.map((g) => (
          <div key={`${g.issue}-${g.items[0].id}`}>
            <p className="mb-1.5 px-1 text-xs font-bold uppercase tracking-wide text-ink/40">
              Выпуск #{String(g.issue).padStart(2, '0')} · {formatDate(g.date)}
            </p>
            <div className="space-y-1.5">
              {g.items.map((p) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={() => setDragId(p.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(p.id);
                  }}
                  onDragEnd={() => setDragId(null)}
                  onClick={() => requestSelect(p.id)}
                  className={cn(
                    'group flex cursor-pointer items-center gap-2 rounded-xl border-2 p-2 transition-colors',
                    selectedId === p.id ? 'border-flame bg-cream/60' : 'border-ink/[0.07] hover:border-ink/15',
                    dragId === p.id && 'opacity-40'
                  )}
                >
                  <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-ink/20" aria-hidden />

                  {/* a real miniature of the page, rendered by the same component */}
                  <div className="relative h-[74px] w-[52px] shrink-0 overflow-hidden rounded border border-ink/10 bg-white">
                    <div
                      className="pointer-events-none absolute left-0 top-0 origin-top-left"
                      style={{ width: p.width, height: p.height, transform: `scale(${52 / p.width})` }}
                    >
                      {p.blocks.map((b) => (
                        <div
                          key={b.id}
                          className="absolute"
                          style={{ left: b.x, top: b.y, width: b.width, height: b.height, zIndex: b.zIndex }}
                        >
                          <GazetteBlockContent block={b} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">
                      Стр. {p.pageInIssue}/{p.totalInIssue}
                    </p>
                    <p className="text-xs text-ink/40">{p.blocks.length} блоков</p>
                    {!p.published && (
                      <span className="mt-0.5 inline-block rounded bg-ink/10 px-1.5 py-px text-[10px] font-bold text-ink/50">
                        Черновик
                      </span>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicate(p.id);
                      }}
                      className="rounded p-1 text-ink/30 hover:bg-white hover:text-ink"
                      aria-label="Дублировать страницу"
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(p);
                      }}
                      className="rounded p-1 text-ink/30 hover:bg-crimson/10 hover:text-crimson"
                      aria-label="Удалить страницу"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {pages.length === 0 && (
          <p className="rounded-xl border-2 border-dashed border-ink/15 p-4 text-center text-sm text-ink/45">
            Пока нет ни одной страницы
          </p>
        )}
      </div>

      {/* ------------------------------ builder ------------------------------ */}
      <div className="min-w-0">
        {selected ? (
          <GazetteBuilder
            key={selected.id}
            pageId={selected.id}
            initialWidth={selected.width}
            initialHeight={selected.height}
            initialIssueNumber={selected.issueNumber}
            initialIssueDate={selected.issueDate}
            initialPublished={selected.published}
            initialBlocks={toEditableBlocks(selected)}
            onSaved={() => router.refresh()}
          />
        ) : (
          <div className="card grid place-items-center p-12 text-center">
            <p className="font-display text-lg font-extrabold text-ink">Начнём выпуск</p>
            <p className="mt-1.5 max-w-sm text-sm text-ink/55">
              Создайте первую страницу — можно взять готовый макет, там уже будут заголовок, новости и фото.
            </p>
            <button type="button" onClick={() => setShowCreate(true)} className="btn-primary mt-4 !py-2 text-sm">
              <Plus className="h-4 w-4" aria-hidden /> Новая страница
            </button>
          </div>
        )}
      </div>

      {/* --------------------------- create modal --------------------------- */}
      {showCreate && (
        <div className="fixed inset-0 z-[10050] grid place-items-center bg-ink/60 p-4" onClick={() => setShowCreate(false)}>
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="font-display text-xl font-extrabold text-ink">Новая страница</h3>
            <p className="mt-1 text-sm text-ink/55">
              Выберите макет — блоки уже будут расставлены, останется заменить текст и фото.
            </p>

            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-ink/60">Выпуск №</span>
              <input
                type="number"
                min={1}
                value={newIssue}
                onChange={(e) => setNewIssue(Number(e.target.value) || 1)}
                className="tc-input w-20 !py-1.5 text-sm"
                aria-label="Номер выпуска"
              />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="tc-input !py-1.5 text-sm"
                aria-label="Дата выпуска"
              />
              <button
                type="button"
                onClick={() => setNewIssue((n) => n + 1)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-flame hover:bg-cream"
              >
                Начать новый выпуск
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {TEMPLATE_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => create(id)}
                  disabled={pending}
                  className="rounded-xl border-2 border-ink/[0.08] p-3 text-left transition-colors hover:border-flame hover:bg-cream/40 disabled:opacity-50"
                >
                  <div className="relative mb-2 h-28 overflow-hidden rounded-lg border border-ink/10 bg-white">
                    {TEMPLATES[id].map((b, i) => (
                      <div
                        key={i}
                        className={cn(
                          'absolute rounded-[1px]',
                          b.kind === 'banner'
                            ? 'bg-flame'
                            : b.kind === 'cover'
                              ? 'bg-ink'
                              : b.tone === 'flame'
                                ? 'bg-flame/70'
                                : b.kind === 'gallery'
                                  ? 'bg-ink/25'
                                  : 'bg-ink/12'
                        )}
                        style={{
                          left: `${(b.x / 1240) * 100}%`,
                          top: `${(b.y / 1754) * 100}%`,
                          width: `${(b.width / 1240) * 100}%`,
                          height: `${(b.height / 1754) * 100}%`,
                        }}
                      />
                    ))}
                    {TEMPLATES[id].length === 0 && (
                      <span className="absolute inset-0 grid place-items-center text-xs text-ink/25">пусто</span>
                    )}
                  </div>
                  <span className="block text-sm font-bold text-ink">{TEMPLATE_LABELS[id].label}</span>
                  <span className="block text-[11px] leading-tight text-ink/45">{TEMPLATE_LABELS[id].hint}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------- unsaved-work switch guard ------------------- */}
      {pendingSwitch && (
        <div className="fixed inset-0 z-[10050] grid place-items-center bg-ink/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true">
            <h3 className="font-display text-lg font-extrabold text-ink">Несохранённые изменения</h3>
            <p className="mt-1.5 text-sm text-ink/60">
              На этой странице есть правки, которые ещё не сохранены. Что с ними сделать?
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const id = pendingSwitch;
                  setPendingSwitch(null);
                  startTransition(async () => {
                    try {
                      await gazetteGuard.flush();
                      setSelectedId(id);
                      router.refresh();
                    } catch {
                      /* save failed — stay put, the builder shows the error */
                    }
                  });
                }}
                className="btn-primary !py-2.5 text-sm"
              >
                Сохранить и перейти
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(pendingSwitch);
                  setPendingSwitch(null);
                }}
                className="btn-outline !py-2.5 text-sm"
              >
                Перейти без сохранения
              </button>
              <button
                type="button"
                onClick={() => setPendingSwitch(null)}
                className="py-2 text-sm font-semibold text-ink/50 hover:text-ink"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------- delete confirm ------------------------- */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[10050] grid place-items-center bg-ink/60 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-extrabold text-ink">Удалить страницу?</h3>
            <p className="mt-1.5 text-sm text-ink/60">
              Страница {confirmDelete.pageInIssue} из выпуска #{String(confirmDelete.issueNumber).padStart(2, '0')},{' '}
              {confirmDelete.blocks.length} блоков. Это действие нельзя отменить.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => doDelete(confirmDelete)}
                className="flex-1 rounded-lg bg-crimson py-2.5 text-sm font-bold text-white hover:bg-crimson/90"
              >
                Удалить
              </button>
              <button type="button" onClick={() => setConfirmDelete(null)} className="btn-outline flex-1 !py-2.5 text-sm">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
