import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllGazettePages } from '@/lib/newspaper';
import GazetteReader from '@/components/gazette/GazetteReader';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ pageId: string }>;
}

/** A gazette page circulates as a pasted link in Telegram — give it a real card. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pageId } = await params;
  const page = (await getAllGazettePages({ publishedOnly: true })).find((p) => p.id === pageId);
  if (!page) return { title: 'Новости' };

  const no = String(page.issueNumber).padStart(2, '0');
  const lead =
    page.blocks.find((b) => b.kind === 'headline' && b.title.trim())?.title ??
    page.blocks.find((b) => b.title.trim())?.title ??
    '';
  const image = page.blocks.find((b) => b.imageUrl)?.imageUrl ?? page.blocks.flatMap((b) => b.images)[0]?.url ?? null;

  return {
    title: `Вещает газета №${no} — стр. ${page.pageInIssue}`,
    description: lead || `Газета TechConnect, выпуск №${no} от ${formatDate(page.issueDate)}.`,
    alternates: { canonical: `/news/${page.id}` },
    openGraph: {
      type: 'article',
      title: lead || `Газета TechConnect №${no}`,
      description: lead || `Выпуск №${no} от ${formatDate(page.issueDate)}.`,
      publishedTime: page.issueDate.toISOString(),
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function NewsPageById({ params }: Props) {
  const { pageId } = await params;
  const pages = await getAllGazettePages({ publishedOnly: true });
  if (!pages.some((p) => p.id === pageId)) notFound();

  return (
    <div className="bg-paperbg py-10 sm:py-14">
      <div className="mx-auto w-full max-w-[1364px] px-4 sm:px-8">
        <GazetteReader pages={pages} initialPageId={pageId} />
      </div>
    </div>
  );
}
