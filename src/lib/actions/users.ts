'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession, hashPassword } from '@/lib/auth';

async function guardAdmin() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  if (session.role !== 'ADMIN') throw new Error('Недостаточно прав');
  return session;
}

export async function createUser(formData: FormData) {
  await guardAdmin();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const name = String(formData.get('name') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const role = String(formData.get('role') ?? 'MODERATOR') === 'ADMIN' ? 'ADMIN' : 'MODERATOR';

  if (!email || !password) throw new Error('Email и пароль обязательны');
  if (password.length < 6) throw new Error('Пароль минимум 6 символов');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Пользователь с таким email уже есть');

  await prisma.user.create({
    data: { email, name: name || null, role, passwordHash: await hashPassword(password) },
  });
  revalidatePath('/admin/users');
}

export async function deleteUser(id: string) {
  const session = await guardAdmin();
  if (session.id === id) throw new Error('Нельзя удалить самого себя');

  const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
  const target = await prisma.user.findUnique({ where: { id } });
  if (target?.role === 'ADMIN' && admins <= 1) throw new Error('Нельзя удалить последнего администратора');

  await prisma.user.delete({ where: { id } });
  revalidatePath('/admin/users');
}
