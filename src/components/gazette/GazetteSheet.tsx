'use client';

import { useEffect, useRef, useState } from 'react';
import GazetteBlockContent, { TcSmile } from './GazetteBlockContent';
import GazetteMasthead from './GazetteMasthead';
import type { GazettePageData } from '@/lib/newspaper';

/** 15px body copy must not render below ~10.8px. 1240px design ÷ 375px phone = 0.30. */
export const MIN_READABLE_SCALE = 0.72;

/** Measures the available width and returns the sheet's scale factor (never > 1). */
export function useSheetScale(designWidth: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(Math.min(entry.contentRect.width / designWidth, 1));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [designWidth]);

  return { ref, scale };
}

/** The page's true extent — never clip a block that hangs below the stored height. */
export function sheetHeightOf(page: Pick<GazettePageData, 'height' | 'blocks'>) {
  return Math.max(page.height, ...page.blocks.map((b) => b.y + b.height), 0);
}

/**
 * One sheet of the gazette, rendered at design px inside a CSS transform scale.
 * Because geometry AND typography ride the same transform, the admin canvas and
 * the public page are the same object at different sizes — WYSIWYG by
 * construction rather than by keeping two implementations numerically in sync.
 */
export default function GazetteSheet({ page, scale }: { page: GazettePageData; scale: number }) {
  const height = sheetHeightOf(page);

  return (
    <div
      className="tc-gz-paper relative mx-auto overflow-hidden"
      style={{ width: page.width * scale, height: height * scale }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: page.width, height, transform: `scale(${scale})` }}
      >
        <GazetteMasthead issueNumber={page.issueNumber} issueDate={page.issueDate} asHeading />

        {page.blocks.map((b) => (
          <div
            key={b.id}
            className="absolute"
            style={{ left: b.x, top: b.y, width: b.width, height: b.height, zIndex: b.zIndex }}
          >
            <GazetteBlockContent block={b} />
          </div>
        ))}

        <div className="tc-gz-pagefoot">
          <span className="tc-gz-folio">
            {page.pageInIssue} / {page.totalInIssue}
          </span>
          <TcSmile className="tc-gz-mark" />
        </div>
      </div>
    </div>
  );
}
