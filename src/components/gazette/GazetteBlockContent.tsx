import Markdown from '@/components/Markdown';
import { cn } from '@/lib/utils';
import { packRows, ratioOf } from '@/lib/gazette-layout';
import type { BlockKind, BlockTone, ImageFit, ImageLayout, GazetteImage } from '@/lib/newspaper';

export interface GazetteBlockData {
  id: string;
  width: number;
  height: number;
  tone: BlockTone;
  kind: BlockKind;
  number: string;
  kicker: string;
  title: string;
  contentMd: string;
  imageUrl: string | null;
  imageFit: ImageFit;
  imageScale: number;
  imagePosX: number;
  imagePosY: number;
  imageW: number | null;
  imageH: number | null;
  imageLayout: ImageLayout;
  imageSpan: number;
  imageAlt: string;
  images: GazetteImage[];
}

/**
 * A light block has NO chrome at all — it is ink printed directly on paper.
 * Dark and flame blocks become plates with the solid offset shadow. Never a
 * border: borders are what made the page read as a wireframe.
 */
function toneClasses(tone: BlockTone) {
  if (tone === 'dark') return 'tc-gz-plate tc-gz-plate--ink tc-gz--dark';
  if (tone === 'flame') return 'tc-gz-plate tc-gz-plate--flame tc-gz--dark';
  return '';
}

function BlockImage({
  block,
  style,
  className,
}: {
  block: GazetteBlockData;
  style?: React.CSSProperties;
  className?: string;
}) {
  if (!block.imageUrl) return null;
  return (
    <div className={cn('tc-gz-photo shrink-0', className)} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={block.imageUrl}
        alt={block.imageAlt || ''}
        width={block.imageW ?? undefined}
        height={block.imageH ?? undefined}
        loading="lazy"
        decoding="async"
        style={{
          objectFit: block.imageFit === 'contain' ? 'contain' : 'cover',
          objectPosition: `${block.imagePosX}% ${block.imagePosY}%`,
          transform: `scale(${block.imageScale})`,
          // Pivot the zoom on the chosen focal point. With 'center' the zoom
          // slider fought the position sliders and the crop felt broken.
          transformOrigin: `${block.imagePosX}% ${block.imagePosY}%`,
        }}
      />
    </div>
  );
}

/** Rule ABOVE, then [black #1 chip][heavy italic title][gray category]. */
function StoryHeader({ block }: { block: GazetteBlockData }) {
  const hasNumber = block.number.trim().length > 0;
  if (!block.title.trim() && !hasNumber && !block.kicker.trim()) return null;

  return (
    <header className="tc-gz-storyhead">
      <div className="tc-gz-rule" />
      <div className="tc-gz-storyhead-row">
        {hasNumber && <span className="tc-gz-chip">{block.number}</span>}
        {block.title.trim() && <h3 className="tc-gz-storytitle">{block.title}</h3>}
        {block.kicker.trim() && <span className="tc-gz-cat">{block.kicker}</span>}
      </div>
    </header>
  );
}

interface Props {
  block: GazetteBlockData;
  /**
   * 'fill' — the block fills its absolutely-positioned box (the paper sheet).
   * 'auto' — the block sizes to its content (the mobile reflow column).
   */
  fit?: 'fill' | 'auto';
}

export default function GazetteBlockContent({ block, fit = 'fill' }: Props) {
  const auto = fit === 'auto';
  const box = auto ? 'w-full' : 'h-full w-full';
  const isDark = block.tone !== 'light';
  const plate = toneClasses(block.tone);
  const pad = block.tone !== 'light' ? 'tc-gz-pad' : '';

  /* ---------------- banner: "ДЕНЬ 7 ДЕНЬ 7 ДЕНЬ 7 …" ---------------- */
  if (block.kind === 'banner') {
    const text = (block.title.trim() || 'ДЕНЬ').toUpperCase();
    const FS = 26;
    // Deliberately UNDER-fill and let space-between stretch the copies to touch
    // both edges — exact at any width, never clipped mid-word, never dead space.
    const item = text.length * FS * 0.62; // Montserrat 900 italic caps avg advance
    let count = Math.floor((block.width - 36) / (item + FS * 1.15));
    count = Math.max(2, Math.min(9, count));
    if (count % 2 === 0) count -= 1; // odd ⇒ first AND last copy are solid white

    return (
      <div className={cn('tc-gz-daybar', auto && 'h-14')}>
        <div className="tc-gz-daybar-track">
          {Array.from({ length: count }).map((_, i) => (
            <span key={i} className={cn('tc-gz-daybar-item', i % 2 === 1 && 'tc-gz-daybar-item--dim')}>
              {text}
            </span>
          ))}
        </div>
      </div>
    );
  }

  /* ---------------- gallery: common-height, aspect-proportional widths ------ */
  if (block.kind === 'gallery') {
    const images = block.images.filter((i) => i.url);
    const rows = packRows(images.map(ratioOf), block.width, block.height);

    // Photos must never be cropped by a box whose shape happens not to match
    // them. A justified row's height is (width − gaps) ÷ Σaspect, so each row
    // gets the exact height its own photos want; if the stack is taller than
    // the block, every row shrinks by the same factor (still no distortion) and
    // the whole strip is centred in whatever space is left.
    const GAP = 8;
    const rowSums = rows.map((r) => r.reduce((s, i) => s + ratioOf(images[i]), 0));
    const natural = rows.map((r, i) => (block.width - (r.length - 1) * GAP) / (rowSums[i] || 1));
    const stack = natural.reduce((s, h) => s + h, 0) + Math.max(0, rows.length - 1) * GAP;
    const avail = block.height - (block.title.trim() ? 26 : 0) - (block.tone !== 'light' ? 44 : 0);
    const shrink = stack > avail && avail > 0 ? avail / stack : 1;

    return (
      <div className={cn('flex flex-col', box, auto && 'min-h-[9rem]', plate, pad)}>
        {block.title.trim() && (
          <p className={cn('tc-gz-cat mb-2 shrink-0', isDark && 'text-cream/70')}>{block.title}</p>
        )}
        {images.length === 0 ? (
          <div className="grid flex-1 place-items-center py-8 text-xs text-ink/30">Нет фото</div>
        ) : (
          <div className="tc-gz-photorows" style={auto ? { minHeight: '9rem' } : undefined}>
            {rows.map((row, ri) => (
              <div
                key={ri}
                className="tc-gz-photorow"
                style={auto ? { aspectRatio: String(rowSums[ri] || 1) } : { height: natural[ri] * shrink }}
              >
                {row.map((i) => (
                  <figure
                    key={i}
                    className="tc-gz-photo"
                    // flex-basis:0 + flex-grow:aspect at a shared row height IS the
                    // justified-gallery algorithm: widths land exactly proportional
                    // to each photo's shape and the row fills edge to edge.
                    style={{ flexGrow: ratioOf(images[i]), flexBasis: 0 }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={images[i].url}
                      alt={images[i].alt ?? ''}
                      width={images[i].w}
                      height={images[i].h}
                      loading="lazy"
                      decoding="async"
                    />
                  </figure>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ---------------- cover: black plate + flame photo panel ---------------- */
  if (block.kind === 'cover') {
    const lines = (block.title || 'ПОСЛЕДНИЕ|НОВОСТИ').split('|');
    return (
      <div className={cn('flex flex-col', box)}>
        <div className="flex min-h-0 flex-1 gap-6">
          <div className="tc-gz-panel tc-gz-plate--ink flex flex-1 items-center px-9 py-7">
            <h2 className="tc-gz-coverhead">
              {lines.map((l, i) => (
                <span key={i} className="block">
                  {l.trim()}
                </span>
              ))}
            </h2>
          </div>
          <div className="tc-gz-panel tc-gz-plate--flame relative flex-1 overflow-hidden">
            {block.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={block.imageUrl}
                alt={block.imageAlt || ''}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full mix-blend-luminosity opacity-90"
                style={{
                  objectFit: 'cover',
                  objectPosition: `${block.imagePosX}% ${block.imagePosY}%`,
                  transform: `scale(${block.imageScale})`,
                  transformOrigin: `${block.imagePosX}% ${block.imagePosY}%`,
                }}
              />
            )}
            <TcSmile className="absolute left-6 top-6 w-9 text-white" />
          </div>
        </div>
        <div className="tc-gz-rule--thick mt-6 shrink-0" />
      </div>
    );
  }

  /* ---------------- quote ---------------- */
  if (block.kind === 'quote') {
    return (
      <div className={cn('flex flex-col justify-center', box, plate, pad)}>
        <p className="tc-gz-quote">{block.title}</p>
        {block.kicker.trim() && <p className="tc-gz-cat mt-4">{block.kicker}</p>}
      </div>
    );
  }

  /* ---------------- accents: «## ЛЕЙБЛ» rows on flame bars ---------------- */
  if (block.kind === 'accents') {
    const sections = block.contentMd
      .split(/^##\s+/m)
      .slice(1)
      .map((chunk) => {
        const nl = chunk.indexOf('\n');
        return nl === -1
          ? { label: chunk.trim(), body: '' }
          : { label: chunk.slice(0, nl).trim(), body: chunk.slice(nl + 1).trim() };
      });

    return (
      <div className={cn('flex flex-col gap-2 overflow-hidden', box)}>
        {block.title.trim() && <div className="tc-gz-accbar tc-gz-accbar--head shrink-0">{block.title}</div>}
        {sections.map((s, i) => (
          <div key={i} className="shrink-0">
            <div className="tc-gz-accbar">{s.label}</div>
            {s.body && <p className="tc-gz-accbody">{s.body}</p>}
          </div>
        ))}
        {sections.length === 0 && (
          <p className="tc-gz-accbody text-ink/40">
            Добавьте строки вида «## НАЗВАНИЕ» — каждая станет оранжевой полосой.
          </p>
        )}
      </div>
    );
  }

  /* ---------------- headline: big italic caps + justified lead ------------ */
  if (block.kind === 'headline') {
    return (
      <div className={cn('flex flex-col justify-center overflow-hidden', box, plate, pad)}>
        {block.kicker.trim() && <p className="tc-gz-cat mb-2">{block.kicker}</p>}
        {block.title.trim() && <h2 className="tc-gz-headline">{block.title}</h2>}
        {block.imageUrl && (
          <BlockImage block={block} className="mt-4" style={{ height: `${block.imageSpan}%` }} />
        )}
        {block.contentMd.trim() && (
          <Markdown content={block.contentMd} compact dark={isDark} className="tc-gz-subtitle" />
        )}
      </div>
    );
  }

  /* ---------------- content: the workhorse story block ---------------- */
  const hasImage = Boolean(block.imageUrl);
  const hasText = Boolean(
    block.title.trim() || block.number.trim() || block.kicker.trim() || block.contentMd.trim()
  );
  const L = block.imageLayout;
  const horizontal = L === 'left' || L === 'right';

  // full-bleed photo with the text laid over a bottom scrim
  if (hasImage && L === 'full') {
    return (
      <div className={cn('relative overflow-hidden rounded-[10px]', box, auto && 'aspect-[16/10]')}>
        <BlockImage block={block} className="!rounded-none !shadow-none" style={{ position: 'absolute', inset: 0 }} />
        {hasText && (
          <>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
            <div className="tc-gz--dark absolute inset-x-0 bottom-0 px-6 pb-5">
              <StoryHeader block={block} />
              {block.contentMd.trim() && (
                <Markdown content={block.contentMd} compact dark className="tc-gz-body" />
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  const imageStyle: React.CSSProperties = hasText
    ? horizontal
      ? { width: `${block.imageSpan}%`, height: '100%' }
      : auto
        ? { aspectRatio: `${block.width} / ${Math.round((block.height * block.imageSpan) / 100)}` }
        : { height: `${block.imageSpan}%` }
    : auto
      ? { aspectRatio: `${block.width} / ${block.height}` }
      : { flex: 1 };

  return (
    <div
      className={cn(
        'flex',
        box,
        horizontal ? 'flex-row' : 'flex-col',
        (L === 'bottom' || L === 'right') && (horizontal ? 'flex-row-reverse' : 'flex-col-reverse'),
        plate,
        pad
      )}
    >
      {hasImage && <BlockImage block={block} style={imageStyle} />}
      {hasText && (
        <div
          className={cn(
            'min-h-0 min-w-0 flex-1',
            !auto && 'overflow-hidden',
            block.tone === 'light' && !horizontal && 'pt-3',
            horizontal && (L === 'left' ? 'pl-5' : 'pr-5')
          )}
        >
          <StoryHeader block={block} />
          {block.contentMd.trim() && (
            <Markdown content={block.contentMd} compact dark={isDark} className="tc-gz-body" />
          )}
        </div>
      )}
    </div>
  );
}

/** The TechConnect smile, one colour, for print-style use inside the sheet. */
export function TcSmile({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" fill="none" aria-hidden className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M231 13 62 156" stroke="currentColor" strokeWidth="17" strokeLinecap="round" />
      <circle cx="52" cy="152" r="33" fill="currentColor" />
      <path d="M63 107a45 45 0 1 0 33 63" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}
