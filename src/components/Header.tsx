'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrandMark from './BrandMark';
import { NAV, SITE } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled ? 'border-b border-ink/[0.06] bg-white/85 backdrop-blur-lg' : 'bg-transparent'
      )}
    >
      <div className="container-tc flex h-16 items-center justify-between gap-4 sm:h-20">
        <Link href="/" className="group flex items-center gap-2.5" aria-label={SITE.name}>
          <BrandMark className="h-11 w-11 transition-transform group-hover:scale-105" />
          <span className="display text-lg text-ink sm:text-xl">
            Tech<span className="text-flame">Connect</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 text-sm font-semibold transition-colors',
                  active ? 'tc-plate tc-plate-cream' : 'rounded-lg text-ink/70 hover:bg-cream/60 hover:text-ink'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a href={SITE.telegram} target="_blank" rel="noopener noreferrer" className="btn-primary hidden sm:inline-flex">
            Присоединиться
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-11 w-11 place-items-center rounded-full border border-ink/10 lg:hidden"
            aria-label="Меню"
            aria-expanded={open}
          >
            <span className="relative block h-4 w-5">
              <span className={cn('absolute left-0 h-0.5 w-5 bg-ink transition-all', open ? 'top-2 rotate-45' : 'top-0')} />
              <span className={cn('absolute left-0 top-2 h-0.5 w-5 bg-ink transition-all', open && 'opacity-0')} />
              <span className={cn('absolute left-0 h-0.5 w-5 bg-ink transition-all', open ? 'top-2 -rotate-45' : 'top-4')} />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'overflow-hidden border-t border-ink/[0.06] bg-white/95 backdrop-blur-lg transition-all duration-300 lg:hidden',
          open ? 'max-h-96' : 'max-h-0'
        )}
      >
        <nav className="container-tc flex flex-col gap-1 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-4 py-3 text-base font-medium text-ink/80 hover:bg-cream"
            >
              {item.label}
            </Link>
          ))}
          <a href={SITE.telegram} target="_blank" rel="noopener noreferrer" className="btn-primary mt-2">
            Присоединиться
          </a>
        </nav>
      </div>
    </header>
  );
}
