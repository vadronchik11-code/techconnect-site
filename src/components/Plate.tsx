import { cn } from '@/lib/utils';

/**
 * Brand "plate" — the skewed angular label the TechConnect identity puts text on
 * (see ТЕХ|КОННЕКТ lockup). Optional corner slashes echo the comet dashes.
 */

type Variant = 'cream' | 'flame' | 'white' | 'deep';

interface PlateProps {
  variant?: Variant;
  /** small comet slashes poking out of the top-right corner */
  slash?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function Plate({ variant = 'cream', slash = false, className, children }: PlateProps) {
  return (
    <span className={cn('tc-plate', `tc-plate-${variant}`, className)}>
      {slash && (
        <svg aria-hidden viewBox="0 0 44 18" className="tc-plate-slash">
          <line x1="5" y1="14" x2="15" y2="4" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <line x1="22" y1="14" x2="32" y2="4" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <line x1="38" y1="13" x2="41" y2="10" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </span>
  );
}
