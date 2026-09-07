import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';

// Generous, because sharp downscales to 1920px before anything is written —
// a normal 12MP phone photo is 5-9 MB in and ~200 KB out. This is an abuse
// guard, not a quality budget.
const MAX_SIZE = 25 * 1024 * 1024;
// Sniffed from the bytes, never from the browser-supplied Content-Type.
// SVG is deliberately absent: it is served from our own origin, so an uploaded
// SVG containing <script> would execute with access to the admin session.
const RASTER = ['jpeg', 'png', 'webp', 'gif', 'avif', 'tiff'];

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Файл не передан' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Файл слишком большой (макс. 25 МБ)' }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let meta;
  try {
    meta = await sharp(buffer).metadata();
  } catch {
    return NextResponse.json(
      {
        error:
          'Не удалось прочитать изображение. Фото с iPhone в формате HEIC сохраните как JPEG: Настройки → Камера → Форматы → «Наиболее совместимый».',
      },
      { status: 415 }
    );
  }
  if (!meta.format || !RASTER.includes(meta.format)) {
    return NextResponse.json({ error: 'Это не изображение' }, { status: 415 });
  }

  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });

  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.webp`;
  // .rotate() applies EXIF orientation first, so the reported dimensions are
  // already the ones a viewer will see.
  const { data, info } = await sharp(buffer)
    .rotate()
    .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  await writeFile(path.join(dir, filename), data);
  return NextResponse.json({ url: `/uploads/${filename}`, w: info.width, h: info.height });
}
