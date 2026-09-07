import Link from 'next/link';
import BrandMark from './BrandMark';
import CometStreaks from './CometStreaks';
import { NAV, SITE } from '@/lib/constants';

export default function Footer() {
  return (
    <footer className="relative mt-8 overflow-hidden bg-[linear-gradient(175deg,#A81313_0%,#6E0C0C_100%)] text-cream">
      <CometStreaks tone="dark" density={16} seed={21} className="opacity-60" />

      <div className="container-tc relative grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-10 w-10" />
            <span className="display text-lg text-cream">
              Tech<span className="text-flame">Connect</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/75">{SITE.description}</p>
        </div>

        <div>
          <h4 className="display text-sm text-cream">Разделы</h4>
          <ul className="mt-4 space-y-2.5">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-cream/75 transition-colors hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="display text-sm text-cream">Контакты</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-cream/75">
            <li>
              <a href={SITE.telegram} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                Telegram
              </a>
            </li>
            <li>
              <a href={SITE.vk} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                ВКонтакте
              </a>
            </li>
            <li>
              <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-white">
                {SITE.email}
              </a>
            </li>
            <li>{SITE.university}, {SITE.city}</li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="container-tc flex flex-col items-center justify-between gap-2 py-5 text-xs text-cream/60 sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.fullName}. Все права защищены.</p>
          {/* No link to the admin panel: it lives on its own hostname and is
              deliberately not discoverable from the public site. */}
        </div>
      </div>
    </footer>
  );
}
