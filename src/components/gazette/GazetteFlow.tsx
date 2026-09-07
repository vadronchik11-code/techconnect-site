import GazetteBlockContent, { TcSmile } from './GazetteBlockContent';
import GazetteMasthead from './GazetteMasthead';
import { groupIntoRows } from '@/lib/gazette-flow';
import type { GazettePageData } from '@/lib/newspaper';

/**
 * Narrow-screen presentation of a page. Blocks are stacked at their NATIVE
 * design px — type stays exactly the size it was designed at instead of being
 * scaled into illegibility — while the same GazetteBlockContent keeps the
 * masthead, number chips, rules, justified copy and photo rows intact. Only the
 * page geometry is approximated.
 */
export default function GazetteFlow({ page }: { page: GazettePageData }) {
  const rows = groupIntoRows(page.blocks);

  return (
    <div className="tc-gz-flow tc-gz-paper mx-auto w-full max-w-[46rem] px-5 py-7">
      <GazetteMasthead issueNumber={page.issueNumber} issueDate={page.issueDate} inline asHeading />

      {rows.map((row, i) => (
        <div key={i} className="mb-6 flex flex-col gap-4 sm:flex-row">
          {row.map((b) => (
            <div key={b.id} className="min-w-0 flex-1" style={{ flexGrow: b.width }}>
              <GazetteBlockContent block={b} fit="auto" />
            </div>
          ))}
        </div>
      ))}

      {page.blocks.length === 0 && (
        <p className="tc-gz-body py-10 text-center">Эта страница пока пуста.</p>
      )}

      <div className="tc-gz-pagefoot tc-gz-pagefoot--inline">
        <span className="tc-gz-folio">
          {page.pageInIssue} / {page.totalInIssue}
        </span>
        <TcSmile className="tc-gz-mark" />
      </div>
    </div>
  );
}
