import type { GazetteImage } from './newspaper';

/** Fallback shape for legacy rows saved before intrinsic dimensions were captured. */
export const DEFAULT_RATIO = 3 / 2;

export const ratioOf = (i: GazetteImage) => (i.w && i.h ? i.w / i.h : DEFAULT_RATIO);

/**
 * Greedy justified packing, the same idea print layouts and photo galleries use:
 * choose the row count whose rows come closest to filling the frame at a shared
 * row height, then let each photo's width be proportional to its aspect ratio.
 *
 * Returns arrays of indices into the original list, one per row.
 */
export function packRows(ratios: number[], frameW: number, frameH: number): number[][] {
  if (!ratios.length) return [];
  const total = ratios.reduce((s, r) => s + r, 0);
  const rowsN = Math.max(
    1,
    Math.min(ratios.length, Math.round(Math.sqrt((total * frameH) / Math.max(frameW, 1))) || 1)
  );
  const perRow = total / rowsN;

  const rows: number[][] = [[]];
  let acc = 0;
  ratios.forEach((r, i) => {
    // break before this photo when adding half of it would overshoot the target
    if (acc > 0 && acc + r / 2 > perRow && rows.length < rowsN) {
      rows.push([]);
      acc = 0;
    }
    rows[rows.length - 1].push(i);
    acc += r;
  });
  return rows.filter((r) => r.length > 0);
}
