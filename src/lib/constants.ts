export const SITE = {
  name: 'TechConnect',
  fullName: 'TechConnect ЮУрГУ',
  tagline: 'Объединение технических специалистов ЮУрГУ',
  description:
    'TechConnect — объединение при ЮУрГУ: проводим митапы, хакатоны и форумы, даём практику техническим специальностям и помогаем с трудоустройством.',
  telegram: 'https://t.me/susu_techconnect',
  vk: 'https://vk.com/techconnectsusu',
  email: 'hello@techconnect.ru',
  city: 'Челябинск',
  university: 'ЮУрГУ',
};

export const NAV = [
  { href: '/', label: 'Главная' },
  { href: '/news', label: 'Новости' },
  { href: '/events', label: 'Мероприятия' },
  { href: '/portfolio', label: 'Портфолио' },
  { href: '/partners', label: 'Партнёры' },
  { href: '/contacts', label: 'Контакты' },
];

export const EVENT_TYPES = {
  MEETUP: { label: 'Митап', emoji: '🎤' },
  HACKATHON: { label: 'Хакатон', emoji: '⚡' },
  FORUM: { label: 'Форум', emoji: '🎯' },
  OTHER: { label: 'Событие', emoji: '📌' },
} as const;

export const EVENT_STATUS = {
  PAST: { label: 'Прошло', tone: 'past' },
  ONGOING: { label: 'Идёт сейчас', tone: 'ongoing' },
  UPCOMING: { label: 'Скоро', tone: 'upcoming' },
} as const;

export const APPLICATION_STATUS = {
  NEW: 'Новая',
  REVIEWED: 'Просмотрена',
  ACCEPTED: 'Принята',
  REJECTED: 'Отклонена',
} as const;

export type EventType = keyof typeof EVENT_TYPES;
export type EventStatus = keyof typeof EVENT_STATUS;
