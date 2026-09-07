import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IMAGE_RE = /\.(webp|png|jpe?g|gif|avif)$/i;

/** Reading intrinsic size costs a file open — cache it per path+mtime. */
const dimCache = new Map<string, { w: number; h: number }>();

async function dimensions(fullPath: string, key: string) {
  const hit = dimCache.get(key);
  if (hit) return hit;
  try {
    const m = await sharp(fullPath).metadata();
    const dims = { w: m.width ?? 0, h: m.height ?? 0 };
    dimCache.set(key, dims);
    return dims;
  } catch {
    return { w: 0, h: 0 };
  }
}

async function collect(dirName: string, urlPrefix: string) {
  const dir = path.join(process.cwd(), 'public', dirName);
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }

  const out = [];
  for (const name of names) {
    if (!IMAGE_RE.test(name)) continue;
    const full = path.join(dir, name);
    let s;
    try {
      s = await stat(full);
    } catch {
      continue;
    }
    if (!s.isFile()) continue;
    const url = `${urlPrefix}/${name}`;
    const { w, h } = await dimensions(full, `${url}:${s.mtimeMs}`);
    out.push({ url, name, size: s.size, mtime: s.mtimeMs, w, h });
  }
  return out;
}

/**
 * The admin media library: every image already on disk, so a photo can be
 * reused across blocks and pages without re-uploading it. Session-guarded —
 * it enumerates the filesystem.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [uploads, seed] = await Promise.all([collect('uploads', '/uploads'), collect('seed', '/seed')]);
  const items = [...uploads, ...seed].sort((a, b) => b.mtime - a.mtime);
  return NextResponse.json({ items });
}
