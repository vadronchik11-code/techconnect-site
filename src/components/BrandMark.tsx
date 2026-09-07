import { cn } from '@/lib/utils';

/**
 * The round TechConnect badge — the same artwork the browser tab, the home
 * screen icon and the PWA manifest use, so the brand reads identically
 * everywhere. Served as a static SVG so it stays sharp at any size.
 */
export default function BrandMark({ className, title = 'TechConnect' }: { className?: string; title?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand-mark.svg"
      alt={title}
      width={370}
      height={370}
      className={cn('select-none', className)}
      draggable={false}
    />
  );
}
