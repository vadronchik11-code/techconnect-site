'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

async function guard() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
}

const STATUSES = ['NEW', 'REVIEWED', 'ACCEPTED', 'REJECTED'];

export async function setApplicationStatus(id: string, status: string) {
  await guard();
  if (!STATUSES.includes(status)) throw new Error('Недопустимый статус');
  await prisma.application.update({ where: { id }, data: { status } });
  revalidatePath('/admin/applications');
}

export async function deleteApplication(id: string) {
  await guard();
  await prisma.application.delete({ where: { id } });
  revalidatePath('/admin/applications');
}
