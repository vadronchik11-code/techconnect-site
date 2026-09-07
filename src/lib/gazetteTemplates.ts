import type { BlockKind, BlockTone, ImageLayout, GazetteImage } from './newspaper';

/* ===========================================================================
   CANONICAL PAGE GEOMETRY — the one place these numbers live. Imported by the
   seed script, the create-page server action and the admin preset palette, so
   templates, seeded content and hand-authored pages all share a column grid.
   =========================================================================== */
export const PAGE_W = 1240;
export const PAGE_H = 1754;
export const MARGIN = 60;
/** masthead band — blocks must start below it */
export const HEAD_BAND = 170;
/** folio band at the bottom */
export const FOOT_BAND = 90;

export const COL = {
  full: { x: MARGIN, width: PAGE_W - MARGIN * 2 }, // 60 .. 1180  (1120)
  halfL: { x: MARGIN, width: 548 },
  halfR: { x: 632, width: 548 },
  twoThird: { x: MARGIN, width: 736 },
  third: { x: 824, width: 356 },
} as const;

/** A block as stored, minus the identity/relation columns Prisma fills in. */
export interface BlockSeed {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  tone?: BlockTone;
  kind?: BlockKind;
  number?: string;
  kicker?: string;
  title?: string;
  contentMd?: string;
  imageUrl?: string | null;
  imageFit?: string;
  imageScale?: number;
  imagePosX?: number;
  imagePosY?: number;
  imageW?: number | null;
  imageH?: number | null;
  imageLayout?: ImageLayout;
  imageSpan?: number;
  imageAlt?: string;
  images?: GazetteImage[];
}

/* The 7 photos that ship with the repo, with their real intrinsic sizes so
   galleries pack correctly from the very first render. NO new images. */
export const SEED_PHOTOS = {
  hackathon: { url: '/seed/hackathon-team.webp', w: 1000, h: 700 },
  meetup: { url: '/seed/meetup-crowd.webp', w: 1000, h: 700 },
  forum: { url: '/seed/forum-stage.webp', w: 1000, h: 700 },
  award: { url: '/seed/award-offer.webp', w: 800, h: 800 },
  code: { url: '/seed/code-night.webp', w: 900, h: 600 },
  workshop: { url: '/seed/workshop-hands.webp', w: 900, h: 700 },
  campfire: { url: '/seed/campfire-night.webp', w: 900, h: 600 },
} as const;

export type TemplateId = 'cover' | 'standard' | 'photo' | 'text' | 'blank';

export const TEMPLATE_LABELS: Record<TemplateId, { label: string; hint: string }> = {
  cover: { label: 'Обложка', hint: 'Плашка «Последние новости», баннер дня и две новости' },
  standard: { label: 'Стандартная полоса', hint: 'Баннер, заголовок, две новости с фото и фоторяд' },
  photo: { label: 'Фото-полоса', hint: 'Большое фото и два ряда снимков' },
  text: { label: 'Текстовая полоса', hint: 'Заголовок и три текстовых сюжета' },
  blank: { label: 'Пустая', hint: 'Начать с нуля' },
};

export const TEMPLATES: Record<TemplateId, BlockSeed[]> = {
  cover: [
    {
      ...COL.full,
      y: HEAD_BAND + 20,
      height: 360,
      kind: 'cover',
      title: 'ПОСЛЕДНИЕ|НОВОСТИ',
      imageUrl: SEED_PHOTOS.campfire.url,
      imageW: SEED_PHOTOS.campfire.w,
      imageH: SEED_PHOTOS.campfire.h,
    },
    { ...COL.full, y: 580, height: 56, kind: 'banner', tone: 'flame', title: 'ДЕНЬ 1' },
    {
      ...COL.full,
      y: 670,
      height: 230,
      kind: 'headline',
      kicker: 'ГЛАВНОЕ',
      title: 'До ужаса интересный день',
      contentMd:
        'День начинался прекрасно: вы сходили на образовательные мероприятия, посетили телевидение, но под конец дня произошло то, чего никто не мог ожидать…',
    },
    {
      ...COL.full,
      y: 940,
      height: 260,
      kind: 'gallery',
      title: 'Момент дня',
      images: [SEED_PHOTOS.meetup, SEED_PHOTOS.workshop, SEED_PHOTOS.award, SEED_PHOTOS.code],
    },
    {
      ...COL.halfL,
      y: 1240,
      height: 420,
      kind: 'content',
      number: '#1',
      kicker: 'ХАКАТОН',
      title: 'Хакатон собрал 120 участников',
      contentMd:
        '**24 команды** и **48 часов** без сна — участники решали реальные задачи от партнёров объединения. Жюри выбрало пять проектов.',
      imageUrl: SEED_PHOTOS.hackathon.url,
      imageW: SEED_PHOTOS.hackathon.w,
      imageH: SEED_PHOTOS.hackathon.h,
      imageLayout: 'top',
      imageSpan: 55,
    },
    {
      ...COL.halfR,
      y: 1240,
      height: 420,
      kind: 'content',
      number: '#2',
      kicker: 'МИТАП',
      title: 'Frontend сегодня',
      contentMd:
        'Открытие сезона: React 19, Server Components и честный разговор о карьере во фронтенде. Зал был полон до последнего доклада.',
      imageUrl: SEED_PHOTOS.meetup.url,
      imageW: SEED_PHOTOS.meetup.w,
      imageH: SEED_PHOTOS.meetup.h,
      imageLayout: 'top',
      imageSpan: 55,
    },
  ],

  standard: [
    { ...COL.full, y: HEAD_BAND + 20, height: 56, kind: 'banner', tone: 'flame', title: 'ДЕНЬ 2' },
    {
      ...COL.full,
      y: 270,
      height: 200,
      kind: 'headline',
      kicker: 'ОБРАЗОВАНИЕ',
      title: 'Поучились и попели',
      contentMd:
        'За этот день вы успели создать свою игру, узнать о разработке для спецтехники и пройти собеседование на джуна.',
    },
    {
      ...COL.halfL,
      y: 500,
      height: 520,
      kind: 'content',
      number: '#1',
      kicker: 'ФОРУМ',
      title: 'Путь в IT',
      contentMd:
        'Резюме, собеседования и живое общение с HR — 200 участников и больше 30 приглашений на стажировку.',
      imageUrl: SEED_PHOTOS.forum.url,
      imageW: SEED_PHOTOS.forum.w,
      imageH: SEED_PHOTOS.forum.h,
      imageLayout: 'top',
      imageSpan: 55,
    },
    {
      ...COL.halfR,
      y: 500,
      height: 520,
      kind: 'content',
      number: '#2',
      kicker: 'ИТОГИ',
      title: 'Офферы и стажировки',
      contentMd: 'Собрали результаты сезона в одном месте — от первых митапов до финала хакатона.',
      imageUrl: SEED_PHOTOS.award.url,
      imageW: SEED_PHOTOS.award.w,
      imageH: SEED_PHOTOS.award.h,
      imageLayout: 'top',
      imageSpan: 55,
    },
    {
      ...COL.twoThird,
      y: 1050,
      height: 300,
      kind: 'content',
      number: '#3',
      kicker: 'МЕНТОРСТВО',
      title: 'Ночь кода',
      contentMd:
        'Менторы из компаний-партнёров разбирали код команд до утра. *Лучшая подготовка* к защите проекта, какую можно придумать.',
    },
    {
      ...COL.third,
      y: 1050,
      height: 300,
      kind: 'headline',
      tone: 'flame',
      kicker: 'ИТОГИ',
      title: '600+',
      contentMd: '**участников** за сезон',
    },
    {
      ...COL.full,
      y: 1400,
      height: 240,
      kind: 'gallery',
      title: 'Фото дня',
      images: [SEED_PHOTOS.campfire, SEED_PHOTOS.workshop, SEED_PHOTOS.code],
    },
  ],

  photo: [
    { ...COL.full, y: HEAD_BAND + 20, height: 56, kind: 'banner', tone: 'flame', title: 'ДЕНЬ 3' },
    {
      ...COL.full,
      y: 270,
      height: 430,
      kind: 'content',
      kicker: 'ФОТОСЕССИЯ',
      number: '#1',
      title: 'Сейчас вылетит техптичка',
      contentMd: 'Мы решили сохранить ваши лица, улыбки и эмоции в фотографиях.',
      imageUrl: SEED_PHOTOS.forum.url,
      imageW: SEED_PHOTOS.forum.w,
      imageH: SEED_PHOTOS.forum.h,
      imageLayout: 'full',
    },
    {
      ...COL.full,
      y: 730,
      height: 260,
      kind: 'gallery',
      images: [SEED_PHOTOS.hackathon, SEED_PHOTOS.meetup, SEED_PHOTOS.award, SEED_PHOTOS.code],
    },
    {
      ...COL.full,
      y: 1020,
      height: 260,
      kind: 'gallery',
      images: [SEED_PHOTOS.workshop, SEED_PHOTOS.campfire, SEED_PHOTOS.forum],
    },
    {
      ...COL.full,
      y: 1320,
      height: 220,
      kind: 'quote',
      title: 'Мы собрали это за одну ночь — и оно работает',
      kicker: 'Команда-победитель',
    },
  ],

  text: [
    { ...COL.full, y: HEAD_BAND + 20, height: 56, kind: 'banner', tone: 'flame', title: 'ДЕНЬ 4' },
    {
      ...COL.full,
      y: 270,
      height: 200,
      kind: 'headline',
      kicker: 'ГЛАВНОЕ',
      title: 'Заработали, потратили',
      contentMd: 'Четвёртый день превратил Олимп в настоящую ярмарку, где участники торговались и инвестировали.',
    },
    {
      ...COL.full,
      y: 500,
      height: 300,
      kind: 'content',
      number: '#1',
      kicker: 'ЯРМАРКА',
      title: 'Гой еси!',
      contentMd: 'Карты, техкоины, два царя. В этот день вы оказались в старорусской деревне.',
    },
    {
      ...COL.full,
      y: 830,
      height: 300,
      kind: 'content',
      number: '#2',
      kicker: 'Т-БАНК',
      title: 'Инвестиция в будущее',
      contentMd: 'Квиз, головоломки и ребусы, три лекции про стажировку и лотерея с фирменным мерчем.',
    },
    {
      ...COL.full,
      y: 1160,
      height: 300,
      kind: 'content',
      number: '#3',
      kicker: 'АУКЦИОН',
      title: '3, 2, 1… продано!',
      contentMd: 'Под вечер вы потратили все накопления. Лотов было много — от партнёрской раздатки до кваса.',
    },
  ],

  blank: [],
};
