import { NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

/**
 * Serves files from public/uploads dynamically (no static-manifest caching).
 * Next's built-in /public static serving snapshots the directory at server
 * boot in production (`next start`), so files uploaded after boot 404 until
 * a restart. This route reads from disk on every request, so freshly
 * uploaded images are available immediately.
 */

const MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const filePath = path.join(uploadsDir, ...segments);

  // Guard against path traversal — resolved path must stay inside uploadsDir.
  if (!filePath.startsWith(uploadsDir + path.sep) && filePath !== uploadsDir) {
    return NextResponse.json({ error: 'Недопустимый путь' }, { status: 400 });
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error('not a file');

    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] ?? 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(buffer.length),
        // Filenames are unique (timestamp + random suffix) and never overwritten.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
  }
}
