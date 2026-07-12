'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SITE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { TelegramIcon, VkIcon } from './icons';

interface FollowNewsProps {
  className?: string;
  variant?: 'primary' | 'cream';
}

export default function FollowNews({ className, variant = 'primary' }: FollowNewsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className={cn(variant === 'primary' ? 'btn-primary' : 'btn-cream')}
      >
        Следить за новостями
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-56 origin-top overflow-hidden rounded-2xl border border-ink/[0.08] bg-white p-1.5 shadow-card">
          <a
            href={SITE.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left font-semibold text-ink transition-colors hover:bg-cream"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-flame-gradient text-white">
              <TelegramIcon className="h-5 w-5" />
            </span>
            Telegram
          </a>
          <a
            href={SITE.vk}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left font-semibold text-ink transition-colors hover:bg-cream"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-flame-gradient text-white">
              <VkIcon className="h-5 w-5" />
            </span>
            ВКонтакте
          </a>
        </div>
      )}
    </div>
  );
}
