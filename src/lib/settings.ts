import { prisma } from './prisma';

export interface Lead {
  name: string;
  role: string;
  tg?: string;
  vk?: string;
}

export interface SiteSettings {
  telegram: string;
  vk: string;
  email: string;
  address: string;
  aboutText: string;
  statParticipants: string;
  leadership: Lead[];
}

export const DEFAULT_SETTINGS: SiteSettings = {
  telegram: 'https://t.me/susu_techconnect',
  vk: 'https://vk.com/techconnectsusu',
  email: 'hello@techconnect.ru',
  address: 'ЮУрГУ, Челябинск',
  aboutText:
    'TechConnect создан студентами ЮУрГУ. Мы развиваем техническое сообщество университета: проводим мероприятия, даём практику и помогаем расти в IT.',
  statParticipants: '600+',
  leadership: [],
};

/** Reads all settings from DB and merges over defaults. Never throws. */
export async function getSettings(): Promise<SiteSettings> {
  try {
    const rows = await prisma.setting.findMany();
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const raw = (k: keyof SiteSettings) => map.get(k as string);

    let leadership = DEFAULT_SETTINGS.leadership;
    const leadRaw = raw('leadership');
    if (leadRaw) {
      try {
        const parsed = JSON.parse(leadRaw);
        if (Array.isArray(parsed)) leadership = parsed;
      } catch {
        /* keep default */
      }
    }

    return {
      telegram: raw('telegram') || DEFAULT_SETTINGS.telegram,
      vk: raw('vk') || DEFAULT_SETTINGS.vk,
      email: raw('email') || DEFAULT_SETTINGS.email,
      address: raw('address') || DEFAULT_SETTINGS.address,
      aboutText: raw('aboutText') || DEFAULT_SETTINGS.aboutText,
      statParticipants: raw('statParticipants') || DEFAULT_SETTINGS.statParticipants,
      leadership,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
