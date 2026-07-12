import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate, createSession } from '@/lib/auth';

const schema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
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
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Ошибка' }, { status: 422 });
  }

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) {
    return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
  }

  await createSession(user);
  return NextResponse.json({ ok: true });
}
