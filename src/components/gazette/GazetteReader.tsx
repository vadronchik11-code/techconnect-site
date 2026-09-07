'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Newspaper, AlignLeft, Share2 } from 'lucide-react';
import GazetteSheet, { useSheetScale, MIN_READABLE_SCALE } from './GazetteSheet';
import GazetteFlow from './GazetteFlow';
import { formatDate, cn } from '@/lib/utils';
import type { GazettePageData } from '@/lib/newspaper';

interface Props {
  pages: GazettePageData[];
  initialPageId: string;
}

type ViewPref = 'auto' | 'sheet' | 'flow';
type Direction = 'fwd' | 'back';

export default function GazetteReader({ pages, initialPageId }: Props) {
  const router = useRouter();
  const [displayId, setDisplayId] = useState(initialPageId);
  const [pref, setPref] = useState<ViewPref>('auto');
  const [copied, setCopied] = useState(false);
  const [dir, setDir] = useState<Direction>('fwd');

  const latestId = pages[pages.length - 1]?.id ?? null;
  const current = pages.find((p) => p.id === displayId) ?? pages[pages.length - 1] ?? null;

  const { ref: measureRef, scale } = useSheetScale(current?.width ?? 1240);
  const mode: 'sheet' | 'flow' = pref === 'auto' ? (scale >= MIN_READABLE_SCALE ? 'sheet' : 'flow') : pref;

  useEffect(() => {
    try {
      const v = localStorage.getItem('gazette:view');
      if (v === 'sheet' || v === 'flow') setPref(v);
    } catch {
      /* private mode / blocked storage — the automatic choice is fine */
    }
  }, []);

  function choose(next: ViewPref) {
    setPref(next);
    try {
      localStorage.setItem('gazette:view', next);
    } catch {
      /* ignore */
    }
  }

  /**
   * Turning a page must never depend on an animation finishing. Awaiting
   * Animation.finished deadlocks whenever the tab is backgrounded or is not
   * compositing frames, which silently breaks navigation entirely. So the page
   * swaps synchronously and the slide-in is a purely decorative CSS animation
   * on a key-remounted wrapper — if it never runs, the page is simply there.
   */
  const goTo = useCallback(
    (id: string | null, direction: Direction, pushUrl = true) => {
      if (!id || id === displayId) return;
      if (pushUrl) {
        const url = id === latestId ? '/news' : `/news/${id}`;
        window.history.pushState({ gazettePageId: id }, '', url);
      }
      setDir(direction);
      setDisplayId(id);
    },
    [displayId, latestId]
  );

  // Keep the real browser Back/Forward in sync with the reader.
  useEffect(() => {
    function onPopState() {
      const match = window.location.pathname.match(/\/news\/([^/]+)/);
      const id = match ? match[1] : latestId;
      if (!id) return;
      const targetIdx = pages.findIndex((p) => p.id === id);
      const curIdx = pages.findIndex((p) => p.id === displayId);
      if (targetIdx === -1 || targetIdx === curIdx) return;
      goTo(id, targetIdx > curIdx ? 'fwd' : 'back', false);
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [displayId, pages, latestId, goTo]);

  // Arrow keys page the gazette — but must not be stolen from form controls.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t?.tagName ?? '')) return;
      if (e.key === 'ArrowLeft' && current?.prevInIssueId) goTo(current.prevInIssueId, 'back');
      if (e.key === 'ArrowRight' && current?.nextInIssueId) goTo(current.nextInIssueId, 'fwd');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, goTo]);

  // Preload the neighbouring pages' photos — the data is already local.
  useEffect(() => {
    if (!current) return;
    for (const id of [current.prevInIssueId, current.nextInIssueId]) {
      const p = pages.find((x) => x.id === id);
      if (!p) continue;
      for (const b of p.blocks) {
        const urls = [b.imageUrl, ...b.images.map((i) => i.url)].filter(Boolean) as string[];
        for (const url of urls) {
          const img = new Image();
          img.src = url;
        }
      }
    }
  }, [current, pages]);

  // Swipe to turn pages on touch.
  const touch = useRef<{ x: number; y: number } | null>(null);
  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === 'mouse') return;
    touch.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerUp(e: React.PointerEvent) {
    const start = touch.current;
    touch.current = null;
    if (!start || !current) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < 56 || Math.abs(dx) <= Math.abs(dy) * 1.6) return;
    if (dx < 0) goTo(current.nextInIssueId, 'fwd');
    else goTo(current.prevInIssueId, 'back');
  }

  async function share() {
    if (!current) return;
    const url = `${window.location.origin}/news/${current.id}`;
    try {
      if (navigator.share) await navigator.share({ url, title: 'Вещает газета TechConnect' });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user dismissed the share sheet */
    }
  }

  if (!current) {
    return (
      <div className="tc-gz-paper mx-auto max-w-[46rem] px-8 py-16 text-center">
        <p className="tc-gz-headline" style={{ fontSize: 38 }}>
          Готовим первый выпуск
        </p>
        <p className="tc-gz-body mt-4 !text-center">Свежий номер выйдет совсем скоро.</p>
      </div>
    );
  }

  const issuePages = pages.filter((p) => p.issueNumber === current.issueNumber);
  const issueNumbers = [...new Set(pages.map((p) => p.issueNumber))];

  return (
    <div>
      {/* Issue chips + view toggle — browser chrome, deliberately quiet so the
          sheet stays the only saturated thing on the screen. */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {issueNumbers.map((n) => {
            const first = pages.find((p) => p.issueNumber === n)!;
            const active = n === current.issueNumber;
            return (
              <button
                key={n}
                type="button"
                onClick={() => goTo(first.id, n > current.issueNumber ? 'fwd' : 'back')}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-bold transition-colors',
                  active ? 'bg-ink text-cream' : 'bg-ink/[0.06] text-ink/55 hover:bg-ink/10 hover:text-ink'
                )}
              >
                №{String(n).padStart(2, '0')} · {formatDate(first.issueDate)}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 rounded-full bg-ink/[0.06] p-1">
          <button
            type="button"
            onClick={() => choose('sheet')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors',
              mode === 'sheet' ? 'bg-white text-ink shadow-sm' : 'text-ink/50 hover:text-ink'
            )}
          >
            <Newspaper className="h-3.5 w-3.5" aria-hidden /> Как в газете
          </button>
          <button
            type="button"
            onClick={() => choose('flow')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors',
              mode === 'flow' ? 'bg-white text-ink shadow-sm' : 'text-ink/50 hover:text-ink'
            )}
          >
            <AlignLeft className="h-3.5 w-3.5" aria-hidden /> Читать текстом
          </button>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        Выпуск №{current.issueNumber}, страница {current.pageInIssue} из {current.totalInIssue}
      </p>

      <div ref={measureRef} onPointerDown={onPointerDown} onPointerUp={onPointerUp} style={{ touchAction: 'pan-y' }}>
        {/* keyed so each page turn remounts and replays the entrance animation */}
        <div key={displayId} className={dir === 'fwd' ? 'tc-gz-turn-fwd' : 'tc-gz-turn-back'}>
          <article aria-labelledby="gazette-masthead">
            {mode === 'sheet' ? <GazetteSheet page={current} scale={scale} /> : <GazetteFlow page={current} />}
          </article>
        </div>
      </div>

      {/* Page navigation. The folio and brand mark are printed on the sheet
          itself, so this row carries only the controls. */}
      <nav className="mt-5 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => goTo(current.prevInIssueId, 'back')}
          disabled={!current.prevInIssueId}
          className="flex items-center gap-1.5 text-sm font-semibold text-ink/45 transition-colors hover:text-crimson disabled:opacity-30 disabled:hover:text-ink/45"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Назад
        </button>

        <div className="flex items-center gap-1.5">
          {issuePages.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => goTo(p.id, p.order > current.order ? 'fwd' : 'back')}
              aria-label={`Страница ${p.pageInIssue}`}
              aria-current={p.id === current.id}
              className={cn(
                'h-2 rounded-full transition-all',
                p.id === current.id ? 'w-6 bg-flame' : 'w-2 bg-ink/20 hover:bg-ink/40'
              )}
            />
          ))}
          <button
            type="button"
            onClick={share}
            className="ml-2 rounded-full p-1.5 text-ink/35 transition-colors hover:bg-cream hover:text-crimson"
            aria-label="Поделиться страницей"
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden />
          </button>
          {copied && <span className="text-xs font-semibold text-crimson">Ссылка скопирована</span>}
        </div>

        <button
          type="button"
          onClick={() => goTo(current.nextInIssueId, 'fwd')}
          disabled={!current.nextInIssueId}
          className="flex items-center gap-1.5 text-sm font-semibold text-ink/45 transition-colors hover:text-crimson disabled:opacity-30 disabled:hover:text-ink/45"
        >
          Далее <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </nav>

      {/* Crossing between issues is a deliberate, signposted action rather than
          a silent walk past the end of the current one. */}
      {!current.nextInIssueId && current.nextIssueFirstPageId && (
        <p className="mt-6 text-center text-sm text-ink/50">
          Конец выпуска №{String(current.issueNumber).padStart(2, '0')} ·{' '}
          <button
            type="button"
            onClick={() => router.push(`/news/${current.nextIssueFirstPageId}`)}
            className="font-bold text-crimson hover:text-flame"
          >
            Читать выпуск №{String(current.nextIssueNumber ?? 0).padStart(2, '0')} →
          </button>
        </p>
      )}
      {!current.prevInIssueId && current.prevIssueFirstPageId && (
        <p className="mt-6 text-center text-sm text-ink/50">
          <button
            type="button"
            onClick={() => router.push(`/news/${current.prevIssueFirstPageId}`)}
            className="font-bold text-crimson hover:text-flame"
          >
            ← Предыдущий выпуск №{String(current.prevIssueNumber ?? 0).padStart(2, '0')}
          </button>
        </p>
      )}
    </div>
  );
}
