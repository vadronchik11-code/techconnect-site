import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const schema = z.object({
  name: z.string().trim().min(1, 'Укажите имя').max(100),
  contact: z.string().trim().min(1, 'Укажите контакт').max(120),
  role: z.string().trim().max(60).optional().default(''),
  message: z.string().trim().max(1000).optional().default(''),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Ошибка валидации' }, { status: 422 });
  }

  await prisma.application.create({ data: parsed.data });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const items = await prisma.application.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(items);
}
