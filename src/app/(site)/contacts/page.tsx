import type { Metadata } from 'next';
import { Mail, MapPin } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import CometStreaks from '@/components/CometStreaks';
import JoinForm from '@/components/JoinForm';
import Markdown from '@/components/Markdown';
import { TelegramIcon, VkIcon } from '@/components/icons';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Контакты' };

export default async function ContactsPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        plate="Свяжитесь с нами"
        title="Контакты"
        description="Хотите присоединиться, стать партнёром или пригласить нас? Напишите — мы на связи."
        seed={53}
      />

      <div className="section">
        <div className="container-tc">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            {/* Left: info */}
            <div className="space-y-6">
              <div className="card p-7">
                <h3 className="display text-lg text-ink">Общие контакты</h3>
                <ul className="mt-4 space-y-3 text-ink/70">
                  {settings.telegram && (
                    <li className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-cream text-crimson">
                        <TelegramIcon className="h-5 w-5" />
                      </span>
                      <a href={settings.telegram} target="_blank" rel="noopener noreferrer" className="font-bold text-flame hover:text-crimson">
                        Telegram
                      </a>
                    </li>
                  )}
                  {settings.vk && (
                    <li className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-cream text-crimson">
                        <VkIcon className="h-5 w-5" />
                      </span>
                      <a href={settings.vk} target="_blank" rel="noopener noreferrer" className="font-bold text-flame hover:text-crimson">
                        ВКонтакте
                      </a>
                    </li>
                  )}
                  {settings.email && (
                    <li className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-cream text-crimson">
                        <Mail className="h-5 w-5" aria-hidden />
                      </span>
                      <a href={`mailto:${settings.email}`} className="font-bold text-flame hover:text-crimson">
                        {settings.email}
                      </a>
                    </li>
                  )}
                  {settings.address && (
                    <li className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-cream text-crimson">
                        <MapPin className="h-5 w-5" aria-hidden />
                      </span>
                      <span>{settings.address}</span>
                    </li>
                  )}
                </ul>
              </div>

              {settings.leadership.length > 0 && (
                <div className="card p-7">
                  <h3 className="display text-lg text-ink">Руководство проекта</h3>
                  <ul className="mt-4 space-y-4">
                    {settings.leadership.map((l, i) => (
                      <li key={i} className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-ink">{l.name}</p>
                          <p className="text-sm text-ink/55">{l.role}</p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          {l.tg && (
                            <a href={l.tg} target="_blank" rel="noopener noreferrer" className="chip bg-cream text-crimson hover:bg-flame hover:text-white">
                              Telegram
                            </a>
                          )}
                          {l.vk && (
                            <a href={l.vk} target="_blank" rel="noopener noreferrer" className="chip bg-cream text-crimson hover:bg-flame hover:text-white">
                              ВК
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="relative overflow-hidden rounded-xl bg-fire-deep p-7 text-white">
                <CometStreaks tone="flame" density={12} seed={61} className="opacity-70" />
                <div className="relative">
                  <h3 className="display text-lg">О проекте</h3>
                  <Markdown content={settings.aboutText} compact dark className="mt-2 text-white/90" />
                </div>
              </div>
            </div>

            {/* Right: form */}
            <div>
              <JoinForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
