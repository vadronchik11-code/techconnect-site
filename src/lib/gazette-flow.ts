import type { GazetteBlockData } from './newspaper';

/**
 * Groups absolutely-positioned blocks into the visual rows a reader perceives:
 * a block joins the current row when its vertical span overlaps that row by more
 * than half the shorter height, otherwise it starts a new one. Rows come out
 * top-to-bottom, blocks within a row left-to-right.
 *
 * Used by the mobile reflow to turn a fixed layout back into reading order.
 */
export function groupIntoRows(blocks: GazetteBlockData[]): GazetteBlockData[][] {
  const sorted = [...blocks].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: GazetteBlockData[][] = [];

  for (const b of sorted) {
    const row = rows[rows.length - 1];
    if (row) {
      const top = Math.min(...row.map((r) => r.y));
      const bottom = Math.max(...row.map((r) => r.y + r.height));
      const overlap = Math.min(bottom, b.y + b.height) - Math.max(top, b.y);
      if (overlap > 0.5 * Math.min(b.height, bottom - top)) {
        row.push(b);
        continue;
      }
    }
    rows.push([b]);
  }

  return rows.map((r) => [...r].sort((a, b) => a.x - b.x));
}
