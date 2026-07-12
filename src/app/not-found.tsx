import Link from 'next/link';
import AnimatedLogo from '@/components/AnimatedLogo';
import CometStreaks from '@/components/CometStreaks';

export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[linear-gradient(155deg,#FF511C_-10%,#A81313_60%)] px-4 text-center text-white">
      <CometStreaks tone="flame" density={24} seed={44} className="opacity-75" />
      <div className="relative">
        <AnimatedLogo className="mx-auto h-24 w-24" />
        <p className="display mt-8 text-7xl">
          <span className="tc-plate tc-plate-cream">404</span>
        </p>
        <h1 className="display mt-7 text-2xl text-cream">Страница не найдена</h1>
        <p className="mt-3 font-medium text-white/85">Возможно, она переехала или ещё не создана.</p>
        <Link href="/" className="btn-cream mt-8">
          На главную
        </Link>
      </div>
    </div>
  );
}
