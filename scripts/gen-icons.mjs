// Generates every raster icon the site needs from the single brand SVG.
//
// Re-run after changing public/brand-mark.svg:
//   node scripts/gen-icons.mjs
//
// Next.js App Router picks up src/app/{icon,apple-icon,favicon}.* automatically
// and emits the right <link> tags, so nothing has to be wired up by hand.
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const SRC = 'public/brand-mark.svg';
const APP = 'src/app';

mkdirSync(APP, { recursive: true });
mkdirSync('public/icons', { recursive: true });

const svg = readFileSync(SRC);

/** librsvg renders from the SVG's own viewBox; density scales it up cleanly. */
async function png(size, out) {
  await sharp(svg, { density: Math.ceil((size / 370) * 96 * 4) })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(out);
  return out;
}

/**
 * Minimal ICO writer. Since Vista the format may embed PNG data directly, so
 * the container is just a 6-byte header plus one 16-byte entry per size.
 * sharp cannot emit .ico, and Safari/older Windows still ask for /favicon.ico.
 */
function buildIco(pngPaths, out) {
  const images = pngPaths.map((p) => readFileSync(p));
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const entries = [];
  let offset = 6 + count * 16;
  images.forEach((data, i) => {
    const size = [16, 32, 48][i];
    const e = Buffer.alloc(16);
    e.writeUInt8(size === 256 ? 0 : size, 0); // width
    e.writeUInt8(size === 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += data.length;
  });

  writeFileSync(out, Buffer.concat([header, ...entries, ...images]));
  return out;
}

const tmp = [];
for (const s of [16, 32, 48]) tmp.push(await png(s, path.join('public/icons', `_ico-${s}.png`)));
buildIco(tmp, path.join(APP, 'favicon.ico'));
console.log('✓ src/app/favicon.ico');

// Apple touch icon — iOS ignores transparency and composites on black, so the
// circular mark is flattened onto the brand's deep red instead.
await sharp(svg, { density: 190 })
  .resize(180, 180)
  .flatten({ background: '#5a0d0d' })
  .png({ compressionLevel: 9 })
  .toFile(path.join(APP, 'apple-icon.png'));
console.log('✓ src/app/apple-icon.png');

await png(512, path.join(APP, 'icon.png'));
console.log('✓ src/app/icon.png');

for (const s of [192, 512]) {
  await png(s, path.join('public/icons', `icon-${s}.png`));
  console.log(`✓ public/icons/icon-${s}.png`);
}

// Maskable variant: Android crops icons to its own shape, so the artwork is
// inset into the safe zone on a solid brand background rather than being
// clipped at the edges.
await sharp(svg, { density: 190 })
  .resize(410, 410)
  .extend({ top: 51, bottom: 51, left: 51, right: 51, background: '#5a0d0d' })
  .flatten({ background: '#5a0d0d' })
  .png({ compressionLevel: 9 })
  .toFile('public/icons/maskable-512.png');
console.log('✓ public/icons/maskable-512.png');

for (const p of tmp) writeFileSync(p, Buffer.alloc(0)); // blank the scratch files
console.log('\nDone.');
