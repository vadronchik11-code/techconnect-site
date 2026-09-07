'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Rnd } from 'react-rnd';
import {
  Plus,
  Save,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
  Ruler,
  Copy,
  Undo2,
  ArrowDownToLine,
  X,
} from 'lucide-react';
import { saveGazettePageLayout, type BlockInput } from '@/lib/actions/newspaper';
import GazetteBlockContent, { TcSmile } from '@/components/gazette/GazetteBlockContent';
import GazetteMasthead from '@/components/gazette/GazetteMasthead';
import GazetteBlockEditor from './GazetteBlockEditor';
import { BLOCK_PRESETS, KIND_LABELS } from './blockPresets';
import { gazetteGuard } from './gazetteGuard';
import { HEAD_BAND, FOOT_BAND, MARGIN } from '@/lib/gazetteTemplates';
import { uploadImages } from '@/lib/upload-client';
import { cn } from '@/lib/utils';
import type { BlockKind } from '@/lib/newspaper';

/**
 * In the editor these image fields are always present — BlockInput leaves them
 * optional only so older callers of the server action keep compiling. Making
 * them required here lets a block be handed straight to the shared renderer.
 */
export interface EditableBlock extends BlockInput {
  id: string;
  imageW: number | null;
  imageH: number | null;
  imageLayout: NonNullable<BlockInput['imageLayout']>;
  imageSpan: number;
  imageAlt: string;
}

interface Props {
  pageId: string;
  initialWidth: number;
  initialHeight: number;
  initialIssueNumber: number;
  initialIssueDate: Date;
  initialPublished: boolean;
  initialBlocks: EditableBlock[];
  onSaved?: () => void;
}

/** snap tolerance and fallback grid, both in design px */
const SNAP = 8;
const GRID = 10;

type Guide = { axis: 'x' | 'y'; pos: number };

function newTempId() {
  return `tmp-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function parseImages(raw: string): { url: string; w?: number; h?: number; alt?: string }[] {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => x && typeof x.url === 'string') : [];
  } catch {
    return [];
  }
}

const KINDS: BlockKind[] = ['content', 'headline', 'banner', 'gallery', 'cover', 'accents', 'quote'];

export default function GazetteBuilder({
  pageId,
  initialWidth,
  initialHeight,
  initialIssueNumber,
  initialIssueDate,
  initialPublished,
  initialBlocks,
  onSaved,
}: Props) {
  const [canvasWidth, setCanvasWidth] = useState(initialWidth);
  const [canvasHeight, setCanvasHeight] = useState(initialHeight);
  const [issueNumber, setIssueNumber] = useState(initialIssueNumber);
  const [issueDate, setIssueDate] = useState(() => initialIssueDate.toISOString().slice(0, 10));
  const [published, setPublished] = useState(initialPublished);
  const [blocks, setBlocks] = useState<EditableBlock[]>(initialBlocks);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState('');

  const [showPresets, setShowPresets] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [preview, setPreview] = useState(false);
  const [zoomMode, setZoomMode] = useState<'fit' | number>('fit');
  const [guides, setGuides] = useState<Guide[]>([]);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);
  const [dropping, setDropping] = useState(false);
  const [hintSeen, setHintSeen] = useState(true);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const history = useRef<EditableBlock[][]>([]);
  const targetsRef = useRef<{ xs: number[]; ys: number[] }>({ xs: [], ys: [] });
  const baselineRef = useRef('');

  const viewScale = zoomMode === 'fit' ? fitScale : zoomMode;
  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  /* ---------------------------- state snapshot ---------------------------- */
  const snapshot = useMemo(
    () => JSON.stringify({ canvasWidth, canvasHeight, issueNumber, issueDate, published, blocks }),
    [canvasWidth, canvasHeight, issueNumber, issueDate, published, blocks]
  );
  const isDirty = snapshot !== baselineRef.current;

  // A page switch remounts this component (keyed by pageId upstream); reset the
  // baseline so the freshly loaded page does not read as dirty.
  useEffect(() => {
    baselineRef.current = JSON.stringify({
      canvasWidth: initialWidth,
      canvasHeight: initialHeight,
      issueNumber: initialIssueNumber,
      issueDate: initialIssueDate.toISOString().slice(0, 10),
      published: initialPublished,
      blocks: initialBlocks,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  useEffect(() => {
    try {
      setHintSeen(localStorage.getItem('gazette-hint-seen') === '1');
      const z = localStorage.getItem('gazette-zoom');
      if (z === 'fit') setZoomMode('fit');
      else if (z && !Number.isNaN(Number(z))) setZoomMode(Number(z));
    } catch {
      /* storage blocked — defaults are fine */
    }
  }, []);

  /* ------------------------------ fit to width ---------------------------- */
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setFitScale(Math.min(1, (w - 8) / canvasWidth));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvasWidth]);

  function setZoom(next: 'fit' | number) {
    setZoomMode(next);
    try {
      localStorage.setItem('gazette-zoom', String(next));
    } catch {
      /* ignore */
    }
  }

  /* ------------------------------ mutations ------------------------------- */
  const pushHistory = useCallback(() => {
    history.current.push(blocks.map((b) => ({ ...b, images: [...b.images] })));
    if (history.current.length > 50) history.current.shift();
  }, [blocks]);

  const undo = useCallback(() => {
    const prev = history.current.pop();
    if (prev) setBlocks(prev);
  }, []);

  const contentBottom = blocks.reduce((m, b) => Math.max(m, b.y + b.height), 0);
  // The visible canvas grows past the stored height so nothing is invisible while
  // editing, but the overflow is marked in red — the server clamps on save.
  const effectiveHeight = Math.max(canvasHeight, contentBottom + 40);

  function addBlock(presetId: string) {
    const preset = BLOCK_PRESETS.find((p) => p.id === presetId) ?? BLOCK_PRESETS[0];
    pushHistory();
    const id = newTempId();
    const maxZ = blocks.reduce((m, b) => Math.max(m, b.zIndex), 0);
    const next: EditableBlock = {
      id,
      x: MARGIN,
      width: 360,
      height: 260,
      zIndex: maxZ + 1,
      tone: 'light',
      kind: 'content',
      number: '',
      kicker: '',
      title: '',
      contentMd: '',
      imageUrl: null,
      imageFit: 'cover',
      imageScale: 1,
      imagePosX: 50,
      imagePosY: 50,
      imageW: null,
      imageH: null,
      imageLayout: 'top',
      imageSpan: 55,
      imageAlt: '',
      images: [],
      ...preset.patch,
      // position always follows the flow, never the preset's canned y
      y: Math.max(HEAD_BAND + 20, contentBottom + 20),
    };
    setBlocks((prev) => [...prev, next]);
    setSelectedId(id);
    setShowPresets(false);
  }

  function updateBlock(id: string, patch: Partial<EditableBlock>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function deleteBlock(id: string) {
    pushHistory();
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }

  function duplicateBlock(id: string) {
    const src = blocks.find((b) => b.id === id);
    if (!src) return;
    pushHistory();
    const maxZ = blocks.reduce((m, b) => Math.max(m, b.zIndex), 0);
    const copy: EditableBlock = { ...src, id: newTempId(), x: src.x + 20, y: src.y + 20, zIndex: maxZ + 1 };
    setBlocks((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  }

  function nudge(dx: number, dy: number) {
    if (!selectedId) return;
    setBlocks((prev) =>
      prev.map((b) => (b.id === selectedId ? { ...b, x: Math.max(0, b.x + dx), y: Math.max(0, b.y + dy) } : b))
    );
  }

  function reorderZ(id: string, dir: 'front' | 'back' | 'up' | 'down') {
    pushHistory();
    setBlocks((prev) => {
      const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const [moved] = sorted.splice(idx, 1);
      const target =
        dir === 'front' ? sorted.length : dir === 'back' ? 0 : dir === 'up' ? Math.min(sorted.length, idx + 1) : Math.max(0, idx - 1);
      sorted.splice(target, 0, moved);
      const z = new Map(sorted.map((b, i) => [b.id, i + 1]));
      return prev.map((b) => ({ ...b, zIndex: z.get(b.id) ?? b.zIndex }));
    });
  }

  /* -------------------------------- saving -------------------------------- */
  const saveAsync = useCallback(async () => {
    setError('');
    try {
      const fresh = await saveGazettePageLayout(
        pageId,
        { width: canvasWidth, height: canvasHeight, issueNumber, issueDate: new Date(issueDate), published },
        blocks
      );
      const mapped: EditableBlock[] = fresh.blocks.map((b) => ({
        id: b.id,
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        zIndex: b.zIndex,
        tone: b.tone === 'dark' ? 'dark' : b.tone === 'flame' ? 'flame' : 'light',
        kind: (KINDS as string[]).includes(b.kind) ? (b.kind as BlockKind) : 'content',
        number: b.number,
        kicker: b.kicker,
        title: b.title,
        contentMd: b.contentMd,
        imageUrl: b.imageUrl,
        imageFit: b.imageFit === 'contain' ? 'contain' : 'cover',
        imageScale: b.imageScale,
        imagePosX: b.imagePosX,
        imagePosY: b.imagePosY,
        imageW: b.imageW,
        imageH: b.imageH,
        imageLayout: (b.imageLayout as EditableBlock['imageLayout']) ?? 'top',
        imageSpan: b.imageSpan,
        imageAlt: b.imageAlt,
        images: parseImages(b.images),
      }));

      // Temp ids become real ids on save. Without remapping, the side panel
      // would blank out because selectedId still points at the dead temp id.
      const prevIdx = blocks.findIndex((b) => b.id === selectedId);
      setCanvasWidth(fresh.width);
      setCanvasHeight(fresh.height);
      setIssueNumber(fresh.issueNumber);
      setIssueDate(fresh.issueDate.toISOString().slice(0, 10));
      setPublished(fresh.published);
      setBlocks(mapped);
      if (prevIdx >= 0) {
        const byPos = mapped.find((m) => {
          const old = blocks[prevIdx];
          return m.x === old.x && m.y === old.y && m.width === old.width && m.height === old.height;
        });
        setSelectedId(byPos?.id ?? null);
      }

      baselineRef.current = JSON.stringify({
        canvasWidth: fresh.width,
        canvasHeight: fresh.height,
        issueNumber: fresh.issueNumber,
        issueDate: fresh.issueDate.toISOString().slice(0, 10),
        published: fresh.published,
        blocks: mapped,
      });
      setSavedAt(new Date());
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить');
      throw err;
    }
  }, [pageId, canvasWidth, canvasHeight, issueNumber, issueDate, published, blocks, selectedId, onSaved]);

  function handleSave() {
    startTransition(() => {
      void saveAsync().catch(() => {});
    });
  }

  // Let the page sidebar ask about unsaved work before it switches pages.
  useEffect(() => {
    gazetteGuard.register(isDirty, saveAsync);
  }, [isDirty, saveAsync]);
  useEffect(() => () => gazetteGuard.reset(), []);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  /* ------------------------------- keyboard ------------------------------- */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName ?? '')) return;
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
        return;
      }
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'd' && selectedId) {
        e.preventDefault();
        duplicateBlock(selectedId);
        return;
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        setPreview(false);
        return;
      }
      if (!selectedId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteBlock(selectedId);
        return;
      }
      if (e.key === '[') return reorderZ(selectedId, 'down');
      if (e.key === ']') return reorderZ(selectedId, 'up');

      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft') return e.preventDefault(), nudge(-step, 0);
      if (e.key === 'ArrowRight') return e.preventDefault(), nudge(step, 0);
      if (e.key === 'ArrowUp') return e.preventDefault(), nudge(0, -step);
      if (e.key === 'ArrowDown') return e.preventDefault(), nudge(0, step);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, blocks, undo]);

  /* ------------------------------- snapping ------------------------------- */
  function buildTargets(exceptId: string) {
    const xs = [MARGIN, canvasWidth - MARGIN, canvasWidth / 2];
    const ys = [HEAD_BAND, effectiveHeight - FOOT_BAND];
    for (const b of blocks) {
      if (b.id === exceptId) continue;
      xs.push(b.x, b.x + b.width / 2, b.x + b.width);
      ys.push(b.y, b.y + b.height / 2, b.y + b.height);
    }
    targetsRef.current = { xs, ys };
  }

  /**
   * react-rnd already divides by the ancestor transform (we pass `scale`), so
   * these values are unscaled design px — do NOT divide by viewScale again.
   */
  function snap(x: number, y: number, w: number, h: number) {
    const { xs, ys } = targetsRef.current;
    const found: Guide[] = [];

    let nx = Math.round(x / GRID) * GRID;
    let best: { d: number; pos: number; val: number } | null = null;
    for (const [edge, off] of [
      [x, 0],
      [x + w / 2, w / 2],
      [x + w, w],
    ] as const) {
      for (const t of xs) {
        const d = Math.abs(edge - t);
        if (d <= SNAP && (best === null || d < best.d)) best = { d, pos: t, val: t - off };
      }
    }
    if (best) {
      nx = best.val;
      found.push({ axis: 'x', pos: best.pos });
    }

    let ny = Math.round(y / GRID) * GRID;
    best = null;
    for (const [edge, off] of [
      [y, 0],
      [y + h / 2, h / 2],
      [y + h, h],
    ] as const) {
      for (const t of ys) {
        const d = Math.abs(edge - t);
        if (d <= SNAP && (best === null || d < best.d)) best = { d, pos: t, val: t - off };
      }
    }
    if (best) {
      ny = best.val;
      found.push({ axis: 'y', pos: best.pos });
    }

    return { x: Math.max(0, nx), y: Math.max(0, ny), guides: found };
  }

  /* ------------------------- drop / paste photos -------------------------- */
  async function ingestFiles(files: File[], target?: string) {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (!images.length) return;
    const uploaded = await uploadImages(images);
    if (!uploaded.length) return;
    pushHistory();

    if (target) {
      const block = blocks.find((b) => b.id === target);
      if (block?.kind === 'gallery') {
        updateBlock(target, { images: [...block.images, ...uploaded] });
      } else {
        const first = uploaded[0];
        updateBlock(target, {
          imageUrl: first.url,
          imageW: first.w ?? null,
          imageH: first.h ?? null,
          imageScale: 1,
          imagePosX: 50,
          imagePosY: 50,
        });
      }
      setSelectedId(target);
      return;
    }

    // dropped onto empty canvas — make a photo block sized to the real shape
    const maxZ = blocks.reduce((m, b) => Math.max(m, b.zIndex), 0);
    const first = uploaded[0];
    const width = 548;
    const ratio = first.w && first.h ? first.w / first.h : 3 / 2;
    const id = newTempId();
    setBlocks((prev) => [
      ...prev,
      {
        ...(BLOCK_PRESETS.find((p) => p.id === 'blank')!.patch as EditableBlock),
        id,
        x: MARGIN,
        y: Math.max(HEAD_BAND + 20, contentBottom + 20),
        width,
        height: Math.round(width / ratio),
        zIndex: maxZ + 1,
        tone: 'light',
        kind: 'content',
        number: '',
        kicker: '',
        title: '',
        contentMd: '',
        imageUrl: first.url,
        imageFit: 'cover',
        imageScale: 1,
        imagePosX: 50,
        imagePosY: 50,
        imageW: first.w ?? null,
        imageH: first.h ?? null,
        imageLayout: 'full',
        imageSpan: 55,
        imageAlt: '',
        images: uploaded.length > 1 ? uploaded : [],
      },
    ]);
    setSelectedId(id);
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t?.isContentEditable || /^(INPUT|TEXTAREA)$/.test(t?.tagName ?? '')) return;
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) void ingestFiles(files, selectedId ?? undefined);
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, blocks]);

  /* --------------------------------- view --------------------------------- */
  const overflowing = contentBottom > canvasHeight;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_440px]">
      <div className="min-w-0">
        {/* -------------------------- toolbar -------------------------- */}
        <div className="card mb-3 flex flex-wrap items-center gap-2.5 p-3.5">
          <div className="relative">
            <button type="button" onClick={() => setShowPresets((v) => !v)} className="btn-primary !py-2 text-sm">
              <Plus className="h-4 w-4" aria-hidden /> Добавить блок
            </button>
            {showPresets && (
              <>
                <div className="fixed inset-0 z-[10001]" onClick={() => setShowPresets(false)} />
                <div className="absolute left-0 top-full z-[10002] mt-2 w-[520px] max-w-[80vw] rounded-xl border border-ink/10 bg-white p-3 shadow-2xl">
                  <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-ink/40">
                    Готовые блоки — нажмите, чтобы добавить
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {BLOCK_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addBlock(p.id)}
                        className="group rounded-lg border-2 border-ink/[0.08] p-2 text-left transition-colors hover:border-flame hover:bg-cream/40"
                      >
                        <PresetThumb id={p.id} />
                        <span className="mt-1.5 block text-xs font-bold text-ink">{p.label}</span>
                        <span className="block text-[11px] leading-tight text-ink/45">{p.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-sm text-ink/60">
            <span>Выпуск №</span>
            <input
              type="number"
              min={1}
              value={issueNumber}
              onChange={(e) => setIssueNumber(Number(e.target.value) || issueNumber)}
              className="tc-input w-16 !py-1.5 text-sm"
              aria-label="Номер выпуска"
              title="Изменение номера перенесёт страницу в другой выпуск"
            />
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="tc-input !py-1.5 text-sm"
              aria-label="Дата выпуска"
            />
          </div>

          {/* zoom */}
          <div className="flex items-center gap-0.5 rounded-lg bg-ink/[0.05] p-0.5 text-xs font-semibold">
            {(['fit', 0.5, 0.75, 1] as const).map((z) => (
              <button
                key={String(z)}
                type="button"
                onClick={() => setZoom(z)}
                className={cn(
                  'rounded-md px-2 py-1 transition-colors',
                  zoomMode === z ? 'bg-white text-ink shadow-sm' : 'text-ink/50 hover:text-ink'
                )}
              >
                {z === 'fit' ? 'Вписать' : `${z * 100}%`}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowGuides((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors',
              showGuides ? 'bg-cream text-crimson' : 'text-ink/45 hover:bg-cream/50'
            )}
            title="Показать поля страницы"
          >
            <Ruler className="h-3.5 w-3.5" aria-hidden /> Поля
          </button>

          <button
            type="button"
            onClick={() => {
              setPreview((v) => !v);
              setSelectedId(null);
            }}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors',
              preview ? 'bg-ink text-cream' : 'text-ink/45 hover:bg-cream/50'
            )}
          >
            {preview ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
            {preview ? 'Выйти из просмотра' : 'Просмотр'}
          </button>

          <button
            type="button"
            onClick={() => setPublished((v) => !v)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
              published ? 'bg-flame text-white' : 'bg-ink/10 text-ink/50 hover:bg-ink/15'
            )}
            title={published ? 'Страница видна на сайте' : 'Страница не видна на сайте'}
          >
            {published ? 'Опубликовано' : 'Черновик'}
          </button>

          <a
            href={`/news/${pageId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline ml-auto !py-2 text-sm"
          >
            <ExternalLink className="h-4 w-4" aria-hidden /> Посмотреть страницу
          </a>

          {isDirty && (
            <span className="rounded-full bg-amber/20 px-2.5 py-1 text-xs font-bold text-crimson">
              Есть несохранённые изменения
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="btn-primary !py-2 text-sm disabled:opacity-60"
          >
            <Save className="h-4 w-4" aria-hidden /> {pending ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>

        {/* first-run hint */}
        {!hintSeen && (
          <div className="mb-3 flex items-start gap-3 rounded-xl border-2 border-flame/25 bg-cream/50 p-3.5 text-sm text-ink/75">
            <div className="flex-1">
              <b>Как собрать страницу:</b> 1) нажмите «Добавить блок» и выберите готовый кусок — заголовок,
              новость с фото, фоторяд; 2) перетащите его мышью и растяните за уголок; 3) выделите блок и
              меняйте текст и фото на панели справа. В конце — «Сохранить».
            </div>
            <button
              type="button"
              onClick={() => {
                setHintSeen(true);
                try {
                  localStorage.setItem('gazette-hint-seen', '1');
                } catch {
                  /* ignore */
                }
              }}
              className="rounded p-1 text-ink/40 hover:text-ink"
              aria-label="Скрыть подсказку"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}

        {error && <p className="mb-3 text-sm font-medium text-crimson">{error}</p>}
        {savedAt && !pending && !error && !isDirty && (
          <p className="mb-3 text-sm font-medium text-green-700">
            Сохранено в {savedAt.toLocaleTimeString('ru-RU')}
          </p>
        )}
        {overflowing && (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg bg-crimson/[0.07] px-3.5 py-2.5 text-sm text-crimson">
            <span>Ниже красной линии — за пределами страницы.</span>
            <button
              type="button"
              onClick={() => setCanvasHeight(Math.ceil((contentBottom + FOOT_BAND) / 20) * 20)}
              className="flex items-center gap-1.5 font-bold underline"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden /> Растянуть страницу
            </button>
          </div>
        )}

        {/* --------------------------- canvas --------------------------- */}
        <div
          ref={wrapperRef}
          className={cn(
            'tc-scroll relative overflow-auto rounded-xl bg-paperbg p-5 transition-shadow',
            dropping && 'ring-4 ring-flame'
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDropping(true);
          }}
          onDragLeave={() => setDropping(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDropping(false);
            void ingestFiles(Array.from(e.dataTransfer.files));
          }}
        >
          <div
            className="tc-gz-paper relative mx-auto"
            style={{ width: canvasWidth * viewScale, height: effectiveHeight * viewScale }}
          >
            <div
              ref={canvasRef}
              className="absolute left-0 top-0 origin-top-left"
              style={{ width: canvasWidth, height: effectiveHeight, transform: `scale(${viewScale})` }}
              onClick={() => setSelectedId(null)}
            >
              {/* printed chrome — identical to what the reader renders */}
              <div className="pointer-events-none">
                <GazetteMasthead issueNumber={issueNumber} issueDate={new Date(issueDate)} />
                <div className="tc-gz-pagefoot" style={{ bottom: effectiveHeight - canvasHeight + 30 }}>
                  <span className="tc-gz-folio">1 / 1</span>
                  <TcSmile className="tc-gz-mark" />
                </div>
              </div>

              {/* safe-area guides */}
              {showGuides && !preview && (
                <div className="pointer-events-none absolute inset-0 z-0">
                  <div className="absolute inset-x-0 border-b border-dashed border-flame/30" style={{ top: HEAD_BAND }} />
                  <div
                    className="absolute inset-x-0 border-t border-dashed border-flame/30"
                    style={{ top: canvasHeight - FOOT_BAND }}
                  />
                  <div className="absolute inset-y-0 border-r border-dashed border-flame/25" style={{ left: MARGIN }} />
                  <div
                    className="absolute inset-y-0 border-l border-dashed border-flame/25"
                    style={{ left: canvasWidth - MARGIN }}
                  />
                </div>
              )}

              {/* overflow marker */}
              {overflowing && (
                <>
                  <div
                    className="pointer-events-none absolute inset-x-0 z-[9999] border-t-2 border-dashed border-crimson"
                    style={{ top: canvasHeight }}
                  />
                  <div
                    className="pointer-events-none absolute inset-x-0 z-[9998] bg-crimson/[0.06]"
                    style={{ top: canvasHeight, height: effectiveHeight - canvasHeight }}
                  />
                </>
              )}

              {/* alignment guides (inside the scaled layer, so no scale math) */}
              {guides.map((g, i) => (
                <div
                  key={i}
                  className="pointer-events-none absolute z-[10000] bg-flame"
                  style={
                    g.axis === 'x'
                      ? { left: g.pos, top: 0, width: 1, height: effectiveHeight }
                      : { top: g.pos, left: 0, height: 1, width: canvasWidth }
                  }
                />
              ))}

              {blocks.map((block) => {
                const live = drag?.id === block.id ? { x: drag.x, y: drag.y } : { x: block.x, y: block.y };
                if (preview) {
                  return (
                    <div
                      key={block.id}
                      className="absolute"
                      style={{ left: block.x, top: block.y, width: block.width, height: block.height, zIndex: block.zIndex }}
                    >
                      <GazetteBlockContent block={block} />
                    </div>
                  );
                }
                return (
                  <Rnd
                    key={block.id}
                    scale={viewScale}
                    bounds="parent"
                    position={live}
                    size={{ width: block.width, height: block.height }}
                    minWidth={80}
                    minHeight={block.kind === 'banner' ? 32 : 80}
                    resizeGrid={[GRID, GRID]}
                    onDragStart={() => {
                      setSelectedId(block.id);
                      buildTargets(block.id);
                      pushHistory();
                    }}
                    onDrag={(_e, d) => {
                      const s = snap(d.x, d.y, block.width, block.height);
                      setDrag({ id: block.id, x: s.x, y: s.y });
                      setGuides(s.guides);
                    }}
                    onDragStop={() => {
                      if (drag?.id === block.id) updateBlock(block.id, { x: drag.x, y: drag.y });
                      setDrag(null);
                      setGuides([]);
                    }}
                    onResizeStart={() => {
                      setSelectedId(block.id);
                      pushHistory();
                    }}
                    onResizeStop={(_e, _dir, ref, _delta, position) =>
                      updateBlock(block.id, {
                        width: ref.offsetWidth,
                        height: ref.offsetHeight,
                        x: Math.round(position.x),
                        y: Math.round(position.y),
                      })
                    }
                    style={{ zIndex: block.zIndex }}
                    className={cn(selectedId === block.id && 'tc-block-selected')}
                  >
                    <div
                      className="group relative h-full w-full cursor-grab active:cursor-grabbing"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(block.id);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDropping(false);
                        void ingestFiles(Array.from(e.dataTransfer.files), block.id);
                      }}
                    >
                      <div className="pointer-events-none h-full w-full">
                        <GazetteBlockContent block={block} />
                      </div>
                      <div
                        className={cn(
                          'pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-ink/70 px-2 py-1 text-xs font-bold text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100',
                          selectedId === block.id && 'opacity-100'
                        )}
                      >
                        <span>{KIND_LABELS[block.kind]}</span>
                        <span className="flex items-center gap-1">
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateBlock(block.id);
                            }}
                            className="pointer-events-auto rounded p-0.5 hover:bg-white/20"
                            aria-label="Дублировать блок"
                          >
                            <Copy className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBlock(block.id);
                            }}
                            className="pointer-events-auto rounded p-0.5 hover:bg-white/20"
                            aria-label="Удалить блок"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </span>
                      </div>
                    </div>
                  </Rnd>
                );
              })}
            </div>

            {/* empty state — outside the scale so it stays readable */}
            {blocks.length === 0 && (
              <div className="pointer-events-none absolute inset-0 z-[10001] grid place-items-center p-6">
                <div className="pointer-events-auto max-w-sm rounded-2xl border-2 border-dashed border-ink/15 bg-white/95 p-7 text-center shadow-lg">
                  <p className="font-display text-lg font-extrabold text-ink">Страница пустая</p>
                  <p className="mt-1.5 text-sm text-ink/55">
                    Выберите готовый блок — заголовок, новость с фото или фоторяд — и он появится на странице
                    уже оформленным.
                  </p>
                  <button type="button" onClick={() => setShowPresets(true)} className="btn-primary mt-4 !py-2 text-sm">
                    <Plus className="h-4 w-4" aria-hidden /> Добавить блок
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/40">
          <span>Стрелки — сдвинуть на 1px, Shift+стрелки — на 10px</span>
          <span>Ctrl+D — дублировать</span>
          <span>Ctrl+Z — отменить</span>
          <span>Ctrl+S — сохранить</span>
          <span>[ ] — слой ниже / выше</span>
          <span>Перетащите фото прямо на страницу</span>
        </p>
      </div>

      {/* ------------------------- side panel ------------------------- */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        {selected ? (
          <GazetteBlockEditor
            key={selected.id}
            block={selected}
            onChange={(patch) => updateBlock(selected.id, patch)}
            onDelete={() => deleteBlock(selected.id)}
            onDuplicate={() => duplicateBlock(selected.id)}
            onReorder={(dir) => reorderZ(selected.id, dir)}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <div className="card p-5">
            <p className="mb-1 font-display text-base font-extrabold text-ink">Блоки страницы</p>
            <p className="mb-3 text-sm text-ink/50">
              Нажмите на блок на странице, чтобы отредактировать его, или добавьте новый.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {BLOCK_PRESETS.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addBlock(p.id)}
                  className="rounded-lg border-2 border-ink/[0.08] p-2 text-left transition-colors hover:border-flame hover:bg-cream/40"
                >
                  <PresetThumb id={p.id} />
                  <span className="mt-1.5 block text-xs font-bold text-ink">{p.label}</span>
                </button>
              ))}
            </div>

            {blocks.length > 0 && (
              <>
                <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-ink/40">
                  Слои ({blocks.length})
                </p>
                <div className="space-y-1">
                  {[...blocks]
                    .sort((a, b) => b.zIndex - a.zIndex)
                    .map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedId(b.id)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-cream/60"
                      >
                        <span className="shrink-0 text-xs font-bold text-ink/35">{KIND_LABELS[b.kind]}</span>
                        <span className="min-w-0 flex-1 truncate text-ink/70">
                          {b.title || b.kicker || '(без названия)'}
                        </span>
                      </button>
                    ))}
                </div>
              </>
            )}

            {history.current.length > 0 && (
              <button
                type="button"
                onClick={undo}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-ink/60 hover:bg-cream"
              >
                <Undo2 className="h-4 w-4" aria-hidden /> Отменить последнее действие
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Tiny CSS-only preview of what each preset produces — no image assets. */
function PresetThumb({ id }: { id: string }) {
  const base = 'h-14 w-full rounded border border-ink/10 bg-white overflow-hidden flex flex-col gap-[3px] p-1.5';
  const bar = 'rounded-[2px]';
  switch (id) {
    case 'banner':
      return (
        <div className={base}>
          <div className={cn(bar, 'h-full w-full bg-flame')} />
        </div>
      );
    case 'lead':
      return (
        <div className={base}>
          <div className={cn(bar, 'h-1 w-1/3 bg-ink/25')} />
          <div className={cn(bar, 'h-3 w-full bg-ink')} />
          <div className={cn(bar, 'h-1 w-full bg-ink/20')} />
          <div className={cn(bar, 'h-1 w-4/5 bg-ink/20')} />
        </div>
      );
    case 'story-photo':
      return (
        <div className={base}>
          <div className={cn(bar, 'h-6 w-full bg-ink/25')} />
          <div className={cn(bar, 'h-[3px] w-full bg-ink')} />
          <div className={cn(bar, 'h-1.5 w-3/4 bg-ink/60')} />
          <div className={cn(bar, 'h-1 w-full bg-ink/20')} />
        </div>
      );
    case 'story-text':
      return (
        <div className={base}>
          <div className={cn(bar, 'h-[3px] w-full bg-ink')} />
          <div className={cn(bar, 'h-1.5 w-2/3 bg-ink/60')} />
          <div className={cn(bar, 'h-1 w-full bg-ink/20')} />
          <div className={cn(bar, 'h-1 w-full bg-ink/20')} />
          <div className={cn(bar, 'h-1 w-3/5 bg-ink/20')} />
        </div>
      );
    case 'photorow':
      return (
        <div className={cn(base, 'flex-row')}>
          <div className={cn(bar, 'h-full flex-[1.4] bg-ink/25')} />
          <div className={cn(bar, 'h-full flex-1 bg-ink/20')} />
          <div className={cn(bar, 'h-full flex-[1.5] bg-ink/25')} />
        </div>
      );
    case 'hero-photo':
      return (
        <div className={base}>
          <div className={cn(bar, 'relative h-full w-full bg-ink/30')}>
            <div className="absolute inset-x-1 bottom-1 h-1 rounded bg-white/70" />
          </div>
        </div>
      );
    case 'stat':
      return (
        <div className={cn(base, 'items-center justify-center bg-flame')}>
          <span className="text-sm font-black italic text-white">120+</span>
        </div>
      );
    case 'quote':
      return (
        <div className={cn(base, 'items-center justify-center')}>
          <span className="text-lg font-black italic leading-none text-ink">«…»</span>
        </div>
      );
    case 'cover':
      return (
        <div className={cn(base, 'flex-row')}>
          <div className={cn(bar, 'h-full flex-1 bg-ink')} />
          <div className={cn(bar, 'h-full flex-1 bg-flame')} />
        </div>
      );
    case 'accents':
      return (
        <div className={base}>
          <div className={cn(bar, 'h-1.5 w-full bg-crimson')} />
          <div className={cn(bar, 'h-1.5 w-full bg-flame')} />
          <div className={cn(bar, 'h-1 w-full bg-ink/15')} />
          <div className={cn(bar, 'h-1.5 w-full bg-flame')} />
        </div>
      );
    default:
      return (
        <div className={cn(base, 'items-center justify-center border-dashed')}>
          <Plus className="h-4 w-4 text-ink/25" aria-hidden />
        </div>
      );
  }
}
