'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

async function guard() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
}

function parse(formData: FormData) {
  return {
    name: String(formData.get('name') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    help: String(formData.get('help') ?? '').trim(),
    url: String(formData.get('url') ?? '').trim() || null,
    logo: String(formData.get('logo') ?? '').trim() || null,
    order: Number(formData.get('order') ?? 0) || 0,
  };
}

export async function createPartner(formData: FormData) {
  await guard();
  const data = parse(formData);
  if (!data.name) throw new Error('Название обязательно');
  await prisma.partner.create({ data });
  revalidatePath('/partners');
  revalidatePath('/admin/partners');
  redirect('/admin/partners');
}

export async function updatePartner(id: string, formData: FormData) {
  await guard();
  const data = parse(formData);
  if (!data.name) throw new Error('Название обязательно');
  await prisma.partner.update({ where: { id }, data });
  revalidatePath('/partners');
  revalidatePath('/admin/partners');
  redirect('/admin/partners');
}

export async function deletePartner(id: string) {
  await guard();
  await prisma.partner.delete({ where: { id } });
  revalidatePath('/partners');
  revalidatePath('/admin/partners');
}

export async function reorderPartners(orderedIds: string[]) {
  await guard();
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.partner.update({ where: { id }, data: { order: index } }))
  );
  revalidatePath('/partners');
  revalidatePath('/');
  revalidatePath('/admin/partners');
}
