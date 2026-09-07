import { prisma } from './prisma';

export type BlockTone = 'light' | 'dark' | 'flame';
export type BlockKind = 'content' | 'headline' | 'banner' | 'gallery' | 'cover' | 'accents' | 'quote';
export type ImageFit = 'cover' | 'contain';
export type ImageLayout = 'top' | 'bottom' | 'left' | 'right' | 'full';

const TONES: BlockTone[] = ['light', 'dark', 'flame'];
const KINDS: BlockKind[] = ['content', 'headline', 'banner', 'gallery', 'cover', 'accents', 'quote'];
const LAYOUTS: ImageLayout[] = ['top', 'bottom', 'left', 'right', 'full'];

export interface GazetteImage {
  url: string;
  /** intrinsic px — present for anything uploaded after the media pipeline landed */
  w?: number;
  h?: number;
  alt?: string;
}

export interface GazetteBlockData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  tone: BlockTone;
  kind: BlockKind;
  number: string;
  kicker: string;
  title: string;
  contentMd: string;
  imageUrl: string | null;
  imageFit: ImageFit;
  imageScale: number;
  imagePosX: number;
  imagePosY: number;
  imageW: number | null;
  imageH: number | null;
  imageLayout: ImageLayout;
  imageSpan: number;
  imageAlt: string;
  images: GazetteImage[];
}

export interface GazettePageData {
  id: string;
  issueNumber: number;
  issueDate: Date;
  order: number;
  width: number;
  height: number;
  published: boolean;
  updatedAt: Date;
  blocks: GazetteBlockData[];
  /** 1-based position of this page among all pages sharing its issueNumber */
  pageInIssue: number;
  totalInIssue: number;
  /** neighbours within the same issue — null at an issue edge */
  prevInIssueId: string | null;
  nextInIssueId: string | null;
  /** first page of the adjacent issue, for a deliberate signposted jump */
  prevIssueFirstPageId: string | null;
  nextIssueFirstPageId: string | null;
  prevIssueNumber: number | null;
  nextIssueNumber: number | null;
}

/** Tolerant parse: old rows are plain [{url}], newer ones carry {url,w,h,alt}. */
export function parseGazetteImages(raw: string): GazetteImage[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x.url === 'string')
      .map((x) => ({
        url: x.url as string,
        w: typeof x.w === 'number' && x.w > 0 ? x.w : undefined,
        h: typeof x.h === 'number' && x.h > 0 ? x.h : undefined,
        alt: typeof x.alt === 'string' && x.alt ? x.alt : undefined,
      }));
  } catch {
    return [];
  }
}

interface RawBlock {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  tone: string;
  kind: string;
  number: string;
  kicker: string;
  title: string;
  contentMd: string;
  imageUrl: string | null;
  imageFit: string;
  imageScale: number;
  imagePosX: number;
  imagePosY: number;
  imageW: number | null;
  imageH: number | null;
  imageLayout: string;
  imageSpan: number;
  imageAlt: string;
  images: string;
}

export function toBlockData(b: RawBlock): GazetteBlockData {
  return {
    id: b.id,
    x: b.x,
    y: b.y,
    width: b.width,
    height: b.height,
    zIndex: b.zIndex,
    tone: (TONES as string[]).includes(b.tone) ? (b.tone as BlockTone) : 'light',
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
    imageLayout: (LAYOUTS as string[]).includes(b.imageLayout) ? (b.imageLayout as ImageLayout) : 'top',
    imageSpan: b.imageSpan,
    imageAlt: b.imageAlt,
    images: parseGazetteImages(b.images),
  };
}

/**
 * All gazette pages, oldest → newest, annotated with per-issue pagination.
 * Blocks come back in READING order (top-to-bottom, left-to-right) rather than
 * paint order — zIndex is still applied as an inline style, so stacking is
 * unchanged, but screen readers, Ctrl+F and the mobile reflow all need DOM
 * order to match how a human reads the page.
 */
export async function getAllGazettePages(opts?: { publishedOnly?: boolean }): Promise<GazettePageData[]> {
  const pages = await prisma.gazettePage.findMany({
    where: opts?.publishedOnly ? { published: true } : undefined,
    orderBy: { order: 'asc' },
    include: { blocks: { orderBy: [{ y: 'asc' }, { x: 'asc' }] } },
  });

  const countByIssue = new Map<number, number>();
  for (const p of pages) countByIssue.set(p.issueNumber, (countByIssue.get(p.issueNumber) ?? 0) + 1);
  const seenByIssue = new Map<number, number>();

  // first page id of each issue, in issue order — powers the "next issue" jump
  const issueOrder: number[] = [];
  const firstPageOfIssue = new Map<number, string>();
  for (const p of pages) {
    if (!firstPageOfIssue.has(p.issueNumber)) {
      firstPageOfIssue.set(p.issueNumber, p.id);
      issueOrder.push(p.issueNumber);
    }
  }

  return pages.map((p, i) => {
    const seen = (seenByIssue.get(p.issueNumber) ?? 0) + 1;
    seenByIssue.set(p.issueNumber, seen);

    const prev = pages[i - 1];
    const next = pages[i + 1];
    const issueIdx = issueOrder.indexOf(p.issueNumber);
    const prevIssue = issueOrder[issueIdx - 1];
    const nextIssue = issueOrder[issueIdx + 1];

    return {
      id: p.id,
      issueNumber: p.issueNumber,
      issueDate: p.issueDate,
      order: p.order,
      width: p.width,
      height: p.height,
      published: p.published,
      updatedAt: p.updatedAt,
      blocks: p.blocks.map(toBlockData),
      pageInIssue: seen,
      totalInIssue: countByIssue.get(p.issueNumber) ?? 1,
      prevInIssueId: prev && prev.issueNumber === p.issueNumber ? prev.id : null,
      nextInIssueId: next && next.issueNumber === p.issueNumber ? next.id : null,
      prevIssueFirstPageId: prevIssue !== undefined ? (firstPageOfIssue.get(prevIssue) ?? null) : null,
      nextIssueFirstPageId: nextIssue !== undefined ? (firstPageOfIssue.get(nextIssue) ?? null) : null,
      prevIssueNumber: prevIssue ?? null,
      nextIssueNumber: nextIssue ?? null,
    };
  });
}

/** Ensures at least one page exists and returns the id of the latest one. */
export async function getLatestGazettePageId(): Promise<string> {
  const latest = await prisma.gazettePage.findFirst({ orderBy: { order: 'desc' } });
  if (latest) return latest.id;
  const created = await prisma.gazettePage.create({ data: { issueNumber: 1, width: 1240, height: 1754 } });
  return created.id;
}
