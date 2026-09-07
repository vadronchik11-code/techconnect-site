'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { BlockTone, BlockKind, ImageFit, ImageLayout, GazetteImage } from '@/lib/newspaper';
import { TEMPLATES, type TemplateId } from '@/lib/gazetteTemplates';

async function guard() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
}

export interface BlockInput {
  /** absent, or a client-generated "tmp-..." placeholder = create a new block */
  id?: string;
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
  imageW?: number | null;
  imageH?: number | null;
  imageLayout?: ImageLayout;
  imageSpan?: number;
  imageAlt?: string;
  images: GazetteImage[];
}

const isTempId = (id?: string) => !id || id.startsWith('tmp-');
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const TONES: string[] = ['light', 'dark', 'flame'];
const KINDS: string[] = ['content', 'headline', 'banner', 'gallery', 'cover', 'accents', 'quote'];
const LAYOUTS: string[] = ['top', 'bottom', 'left', 'right', 'full'];

function revalidateGazette(pageId?: string) {
  revalidatePath('/news');
  if (pageId) revalidatePath(`/news/${pageId}`);
  revalidatePath('/admin/news');
  revalidatePath('/');
}

/**
 * Creates a page appended to the end, optionally pre-filled from a layout
 * template. New pages start as drafts so an author can build a whole issue
 * without publishing half-finished pages.
 */
export async function createGazettePage(issueNumber: number, issueDate: Date, template: TemplateId = 'blank') {
  await guard();
  const last = await prisma.gazettePage.findFirst({ orderBy: { order: 'desc' } });
  const seeds = TEMPLATES[template] ?? [];
  const page = await prisma.gazettePage.create({
    data: {
      issueNumber: Math.max(1, Math.round(issueNumber) || 1),
      issueDate,
      order: (last?.order ?? -1) + 1,
      width: 1240,
      height: 1754,
      published: false,
      blocks: seeds.length
        ? { create: seeds.map((b, i) => ({ ...b, images: JSON.stringify(b.images ?? []), zIndex: i + 1 })) }
        : undefined,
    },
  });
  revalidateGazette();
  return page.id;
}

/** Copies a page and all its blocks — pages within one issue share a skeleton. */
export async function duplicateGazettePage(pageId: string) {
  await guard();
  const src = await prisma.gazettePage.findUniqueOrThrow({ where: { id: pageId }, include: { blocks: true } });
  const last = await prisma.gazettePage.findFirst({ orderBy: { order: 'desc' } });
  const copy = await prisma.gazettePage.create({
    data: {
      issueNumber: src.issueNumber,
      issueDate: src.issueDate,
      order: (last?.order ?? -1) + 1,
      width: src.width,
      height: src.height,
      published: false,
      blocks: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        create: src.blocks.map(({ id, pageId: _p, createdAt, updatedAt, ...rest }) => rest),
      },
    },
  });
  revalidateGazette();
  return copy.id;
}

export async function deleteGazettePage(pageId: string) {
  await guard();
  await prisma.gazettePage.delete({ where: { id: pageId } });
  revalidateGazette();
}

export async function reorderGazettePages(orderedIds: string[]) {
  await guard();
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.gazettePage.update({ where: { id }, data: { order: index } }))
  );
  revalidateGazette();
}

/** Publishes or unpublishes every page of one issue — the unit authors think in. */
export async function setIssuePublished(issueNumber: number, published: boolean) {
  await guard();
  await prisma.gazettePage.updateMany({ where: { issueNumber }, data: { published } });
  revalidateGazette();
}

/** Saves one page in full: its own metadata plus an upsert/delete pass over its blocks. */
export async function saveGazettePageLayout(
  pageId: string,
  meta: { width: number; height: number; issueNumber: number; issueDate: Date; published?: boolean },
  blocks: BlockInput[]
) {
  await guard();

  const width = clamp(Math.round(meta.width), 320, 6000);
  const issueNumber = Math.max(1, Math.round(meta.issueNumber) || 1);

  // A page must never store a height that leaves blocks hanging off the paper:
  // the reader clips to the stored height, so grow it to the real content bottom.
  const requested = clamp(Math.round(meta.height), 320, 20000);
  const needed = blocks.reduce((m, b) => Math.max(m, Math.round(b.y) + Math.round(b.height)), 0) + 40;
  const height = clamp(Math.max(requested, needed), 320, 20000);

  const existing = await prisma.newspaperBlock.findMany({ where: { pageId }, select: { id: true } });
  const keepIds = new Set(blocks.filter((b) => !isTempId(b.id)).map((b) => b.id as string));
  const toDelete = existing.map((b) => b.id).filter((id) => !keepIds.has(id));

  await prisma.$transaction([
    prisma.gazettePage.update({
      where: { id: pageId },
      data: {
        width,
        height,
        issueNumber,
        issueDate: meta.issueDate,
        ...(meta.published === undefined ? {} : { published: meta.published }),
      },
    }),
    ...(toDelete.length ? [prisma.newspaperBlock.deleteMany({ where: { id: { in: toDelete } } })] : []),
    ...blocks.map((b) => {
      const data = {
        x: Math.round(b.x),
        y: Math.round(b.y),
        width: Math.max(40, Math.round(b.width)),
        height: Math.max(28, Math.round(b.height)),
        zIndex: Math.round(b.zIndex) || 0,
        tone: TONES.includes(b.tone) ? b.tone : 'light',
        kind: KINDS.includes(b.kind) ? b.kind : 'content',
        number: (b.number ?? '').slice(0, 12),
        kicker: (b.kicker ?? '').slice(0, 80),
        title: (b.title ?? '').slice(0, 200),
        contentMd: b.contentMd ?? '',
        imageUrl: b.imageUrl || null,
        imageFit: b.imageFit === 'contain' ? 'contain' : 'cover',
        // 'contain' photos need to shrink below 1; cropped ones zoom further than 3
        imageScale: clamp(b.imageScale ?? 1, 0.2, 4),
        imagePosX: clamp(b.imagePosX ?? 50, 0, 100),
        imagePosY: clamp(b.imagePosY ?? 50, 0, 100),
        imageW: b.imageW ?? null,
        imageH: b.imageH ?? null,
        imageLayout: LAYOUTS.includes(b.imageLayout ?? '') ? (b.imageLayout as string) : 'top',
        imageSpan: clamp(Math.round(b.imageSpan ?? 55), 15, 90),
        imageAlt: (b.imageAlt ?? '').slice(0, 200),
        // the explicit map is load-bearing: a bare filter would let a future
        // refactor silently drop w/h and collapse every gallery to the 3:2 fallback
        images: JSON.stringify(
          (b.images ?? [])
            .slice(0, 24)
            .filter((i) => i && i.url)
            .map((i) => ({ url: i.url, w: i.w, h: i.h, alt: i.alt || undefined }))
        ),
      };
      return isTempId(b.id)
        ? prisma.newspaperBlock.create({ data: { ...data, pageId } })
        : prisma.newspaperBlock.update({ where: { id: b.id }, data });
    }),
  ]);

  revalidateGazette(pageId);

  // Return the authoritative persisted state so the client can reconcile
  // client-generated temp ids with real ones (and any server-side clamping).
  return prisma.gazettePage.findUniqueOrThrow({
    where: { id: pageId },
    include: { blocks: { orderBy: [{ y: 'asc' }, { x: 'asc' }] } },
  });
}
