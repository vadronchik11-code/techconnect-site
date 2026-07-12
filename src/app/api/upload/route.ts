import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_SIZE = 6 * 1024 * 1024; // 6 MB
// Static raster formats get re-encoded to WebP + resized; animated GIF and
// vector SVG are stored as-is (re-encoding would break animation/scalability).
const COMPRESSIBLE = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Файл не передан' }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Недопустимый тип файла' }, { status: 415 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Файл слишком большой (макс. 6 МБ)' }, { status: 413 });
  }

  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const uid = `${Date.now()}-${randomUUID().slice(0, 8)}`;

  if (COMPRESSIBLE.includes(file.type)) {
    const filename = `${uid}.webp`;
    const optimized = await sharp(buffer)
      .rotate() // respect EXIF orientation before stripping metadata
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    await writeFile(path.join(dir, filename), optimized);
    return NextResponse.json({ url: `/uploads/${filename}` });
  }

  const ext = (file.name.split('.').pop() ?? 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const filename = `${uid}.${ext}`;
  await writeFile(path.join(dir, filename), buffer);
  return NextResponse.json({ url: `/uploads/${filename}` });
}
