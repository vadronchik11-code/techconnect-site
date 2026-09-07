import { COL, SEED_PHOTOS } from '@/lib/gazetteTemplates';
import type { BlockKind } from '@/lib/newspaper';
import type { EditableBlock } from './GazetteBuilder';

/** Russian labels for the block types — never show raw English kind strings. */
export const KIND_LABELS: Record<BlockKind, string> = {
  content: 'Новость',
  headline: 'Заголовок',
  banner: 'Баннер дня',
  gallery: 'Фоторяд',
  cover: 'Обложка',
  accents: 'Блок-акценты',
  quote: 'Цитата',
};

/** Canonical size per kind — used when switching a block's type so the geometry
 *  follows the content instead of leaving a 360×260 box pretending to be a bar. */
export const KIND_DEFAULT_SIZE: Record<BlockKind, { width: number; height: number }> = {
  content: { width: COL.halfL.width, height: 460 },
  headline: { width: COL.full.width, height: 220 },
  banner: { width: COL.full.width, height: 56 },
  gallery: { width: COL.full.width, height: 260 },
  cover: { width: COL.full.width, height: 360 },
  accents: { width: COL.full.width, height: 520 },
  quote: { width: COL.halfL.width, height: 220 },
};

export interface BlockPreset {
  id: string;
  label: string;
  hint: string;
  patch: Partial<EditableBlock>;
}

/**
 * The insert menu. Every preset drops in already sized to the column grid and
 * already filled with realistic content, so a page is built by picking pieces
 * rather than by inventing geometry in an empty rectangle.
 */
export const BLOCK_PRESETS: BlockPreset[] = [
  {
    id: 'banner',
    label: 'Баннер дня',
    hint: 'Оранжевая полоса-разделитель',
    patch: { kind: 'banner', tone: 'flame', x: COL.full.x, width: COL.full.width, height: 56, title: 'ДЕНЬ 1' },
  },
  {
    id: 'lead',
    label: 'Большой заголовок',
    hint: 'Крупный заголовок и лид',
    patch: {
      kind: 'headline',
      x: COL.full.x,
      width: COL.full.width,
      height: 220,
      kicker: 'ГЛАВНОЕ',
      title: 'До ужаса интересный день',
      contentMd: 'Два-три предложения о том, чем запомнился день.',
    },
  },
  {
    id: 'story-photo',
    label: 'Новость с фото',
    hint: 'Номер, фото и текст',
    patch: {
      kind: 'content',
      x: COL.halfL.x,
      width: COL.halfL.width,
      height: 460,
      number: '#1',
      kicker: 'ХАКАТОН',
      title: 'Заголовок новости',
      contentMd: 'Текст новости — два-три предложения о том, что произошло.',
      imageUrl: SEED_PHOTOS.hackathon.url,
      imageW: SEED_PHOTOS.hackathon.w,
      imageH: SEED_PHOTOS.hackathon.h,
      imageLayout: 'top',
      imageSpan: 55,
    },
  },
  {
    id: 'story-text',
    label: 'Новость без фото',
    hint: 'Только номер и текст',
    patch: {
      kind: 'content',
      x: COL.halfR.x,
      width: COL.halfR.width,
      height: 300,
      number: '#2',
      kicker: 'МИТАП',
      title: 'Заголовок новости',
      contentMd: 'Текст новости — два-три предложения о том, что произошло.',
    },
  },
  {
    id: 'photorow',
    label: 'Фоторяд',
    hint: 'Несколько фото в одну строку',
    patch: {
      kind: 'gallery',
      x: COL.full.x,
      width: COL.full.width,
      height: 260,
      title: 'Момент дня',
      images: [SEED_PHOTOS.meetup, SEED_PHOTOS.forum, SEED_PHOTOS.code],
    },
  },
  {
    id: 'hero-photo',
    label: 'Большое фото',
    hint: 'Фото во всю ширину с подписью',
    patch: {
      kind: 'content',
      x: COL.full.x,
      width: COL.full.width,
      height: 420,
      kicker: 'ФОТОСЕССИЯ',
      title: 'Подпись к фото',
      imageUrl: SEED_PHOTOS.forum.url,
      imageW: SEED_PHOTOS.forum.w,
      imageH: SEED_PHOTOS.forum.h,
      imageLayout: 'full',
    },
  },
  {
    id: 'stat',
    label: 'Цифра-акцент',
    hint: 'Большая цифра на оранжевом',
    patch: {
      kind: 'headline',
      tone: 'flame',
      x: COL.third.x,
      width: COL.third.width,
      height: 210,
      kicker: 'ИТОГИ',
      title: '120+',
      contentMd: '**участников** за три дня',
    },
  },
  {
    id: 'quote',
    label: 'Цитата',
    hint: 'Крупная цитата с автором',
    patch: {
      kind: 'quote',
      x: COL.halfL.x,
      width: COL.halfL.width,
      height: 220,
      title: 'Мы сделали это за одну ночь',
      kicker: 'Имя Фамилия',
    },
  },
  {
    id: 'cover',
    label: 'Обложка',
    hint: 'Чёрная плашка и фото рядом',
    patch: {
      kind: 'cover',
      x: COL.full.x,
      width: COL.full.width,
      height: 360,
      title: 'ПОСЛЕДНИЕ|НОВОСТИ',
      imageUrl: SEED_PHOTOS.campfire.url,
      imageW: SEED_PHOTOS.campfire.w,
      imageH: SEED_PHOTOS.campfire.h,
    },
  },
  {
    id: 'accents',
    label: 'Блок-акценты',
    hint: 'Оранжевые полосы с подписями',
    patch: {
      kind: 'accents',
      x: COL.full.x,
      width: COL.full.width,
      height: 520,
      title: 'ГОРОСКОПЫ',
      contentMd: '## 90-Е\nТекст про этот пункт.\n\n## КРОКСИКИ\nТекст про этот пункт.',
    },
  },
  {
    id: 'blank',
    label: 'Пустой блок',
    hint: 'Настроить всё вручную',
    patch: { kind: 'content', x: COL.halfL.x, width: COL.halfL.width, height: 300 },
  },
];
