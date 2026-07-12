'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import AnimatedLogo from '@/components/AnimatedLogo';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/admin', label: 'Обзор', icon: '📊', exact: true },
  { href: '/admin/news', label: 'Новости', icon: '📰' },
  { href: '/admin/events', label: 'Мероприятия', icon: '🗓️' },
  { href: '/admin/portfolio', label: 'Портфолио', icon: '💼' },
  { href: '/admin/partners', label: 'Партнёры', icon: '🤝' },
  { href: '/admin/applications', label: 'Заявки', icon: '✉️' },
  { href: '/admin/settings', label: 'Настройки', icon: '⚙️' },
];

export default function AdminSidebar({ user }: { user: { name: string | null; email: string; role: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  const links = [...LINKS];
  if (user.role === 'ADMIN') {
    links.push({ href: '/admin/users', label: 'Пользователи', icon: '👥' });
  }

  return (
    <aside className="flex h-full flex-col gap-6 p-5">
      <Link href="/admin" className="flex items-center gap-2.5">
        <AnimatedLogo variant="mark" animated={false} className="h-9 w-9" />
        <span className="font-display text-lg font-extrabold">
          Tech<span className="text-flame">Connect</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {links.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                active ? 'bg-flame-gradient text-white shadow-glow' : 'text-ink/70 hover:bg-cream'
              )}
            >
              <span aria-hidden>{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl bg-cream/50 p-4">
        <p className="truncate text-sm font-semibold text-ink">{user.name ?? user.email}</p>
        <p className="text-xs text-ink/50">{user.role === 'ADMIN' ? 'Администратор' : 'Модератор'}</p>
        <div className="mt-3 flex flex-wrap items-center gap-1">
          <Link href="/" className="btn-ghost !px-2.5 !py-1.5 text-xs">
            На сайт
          </Link>
          <Link href="/admin/password" className="btn-ghost !px-2.5 !py-1.5 text-xs">
            Пароль
          </Link>
          <button onClick={logout} disabled={loggingOut} className="btn-ghost !px-2.5 !py-1.5 text-xs text-crimson">
            {loggingOut ? '…' : 'Выйти'}
          </button>
        </div>
      </div>
    </aside>
  );
}
