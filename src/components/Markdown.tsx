import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface Props {
  content: string;
  /** Tight spacing for small boxes (cards, roadmap teasers) instead of full article rhythm. */
  compact?: boolean;
  /** Inverted palette for text sitting on a dark/near-black background. */
  dark?: boolean;
  className?: string;
}

export default function Markdown({ content, compact = false, dark = false, className }: Props) {
  return (
    <div className={cn('prose-tc', compact && 'tc-prose-compact', dark && 'tc-prose-compact-dark', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
