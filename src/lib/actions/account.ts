'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getSession, hashPassword, verifyPassword } from '@/lib/auth';

/** Self-service password change for the logged-in user. */
export async function changePassword(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  const current = String(formData.get('current') ?? '');
  const next = String(formData.get('next') ?? '');
  const repeat = String(formData.get('repeat') ?? '');

  if (next.length < 6) redirect('/admin/password?error=short');
  if (next !== repeat) redirect('/admin/password?error=mismatch');

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) redirect('/admin/login');

  const ok = await verifyPassword(current, user.passwordHash);
  if (!ok) redirect('/admin/password?error=wrong');

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) },
  });
  redirect('/admin/password?ok=1');
}

/**
 * Admin-only: resets a user's password to a random one and RETURNS it,
 * so the admin can hand it to the person. The old password stops working.
 */
export async function resetUserPassword(userId: string): Promise<string> {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  if (session.role !== 'ADMIN') throw new Error('Недостаточно прав');

  // Readable password without ambiguous characters (0/O, 1/l/I).
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const pass = Array.from(randomBytes(10), (b) => alphabet[b % alphabet.length]).join('');

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(pass) },
  });
  revalidatePath('/admin/users');
  return pass;
}
