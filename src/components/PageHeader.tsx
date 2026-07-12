import CometStreaks from './CometStreaks';
import Plate from './Plate';

interface PageHeaderProps {
  plate?: string;
  title: string;
  description?: string;
  /** vary the streak arrangement per page so headers don't feel stamped */
  seed?: number;
}

export default function PageHeader({ plate, title, description, seed = 11 }: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden bg-[linear-gradient(150deg,#FF511C_-15%,#A81313_60%)] text-white">
      <CometStreaks tone="flame" density={18} seed={seed} className="opacity-70" />
      <div className="container-tc relative py-14 sm:py-20">
        {plate && (
          <Plate variant="cream" slash className="display text-xs sm:text-sm">
            {plate}
          </Plate>
        )}
        <h1 className="display mt-5 max-w-3xl text-4xl leading-[1.05] text-cream sm:text-5xl md:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-lg font-medium leading-relaxed text-white/90">{description}</p>
        )}
      </div>
    </header>
  );
}
