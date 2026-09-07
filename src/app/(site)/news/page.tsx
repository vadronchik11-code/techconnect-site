import type { Metadata } from 'next';
import { getAllGazettePages } from '@/lib/newspaper';
import GazetteReader from '@/components/gazette/GazetteReader';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Новости' };

export default async function NewsPage() {
  const pages = await getAllGazettePages({ publishedOnly: true });
  const latest = pages[pages.length - 1];

  return (
    <div className="bg-paperbg py-10 sm:py-14">
      {/* wide enough for the 1240px design to render at 1:1 on a desktop */}
      <div className="mx-auto w-full max-w-[1364px] px-4 sm:px-8">
        <GazetteReader pages={pages} initialPageId={latest?.id ?? ''} />
      </div>
    </div>
  );
}
