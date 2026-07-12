import Link from 'next/link';
import Plate from './Plate';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  plate?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  action?: { href: string; label: string };
  className?: string;
}

export default function SectionHeading({
  plate,
  title,
  description,
  align = 'left',
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' && 'items-center text-center',
        action && 'sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {plate && (
          <Plate variant="flame" slash className="display text-xs sm:text-sm">
            {plate}
          </Plate>
        )}
        <h2 className="display mt-4 text-3xl leading-[1.06] text-ink sm:text-4xl md:text-[2.6rem]">
          {title}
        </h2>
        {description && <p className="mt-4 text-lg leading-relaxed text-ink/65">{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="btn-outline shrink-0">
          {action.label}
          <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  );
}
