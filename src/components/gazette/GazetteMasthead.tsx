import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Props {
  issueNumber: number;
  issueDate: Date;
  /** Flow mode: sits in normal document order instead of pinned to the sheet. */
  inline?: boolean;
  /** The reader marks the wordmark as the page's h1; the builder must not. */
  asHeading?: boolean;
}

/**
 * The printed masthead, rendered INSIDE the paper on every page — by the public
 * reader and by the admin canvas alike, so authors lay blocks out beneath it
 * instead of underneath an invisible band.
 */
export default function GazetteMasthead({ issueNumber, issueDate, inline = false, asHeading = false }: Props) {
  const Wordmark = asHeading ? 'h1' : 'p';
  return (
    <header className={cn('tc-gz-masthead', inline && 'tc-gz-masthead--inline')}>
      <div>
        <p className="tc-gz-issue">
          #{String(issueNumber).padStart(2, '0')} от {formatDate(issueDate)}
        </p>
        <Wordmark className="tc-gz-wordmark" id={asHeading ? 'gazette-masthead' : undefined}>
          вещает газета
        </Wordmark>
      </div>
      <span className="tc-gz-plate tc-gz-plate--ink tc-gz-newsplate">
        <span className="tc-gz-newsplate-thin">TECH</span>CONNECT
        <span className="tc-gz-newsplate-thin">.NEWS</span>
      </span>
    </header>
  );
}
