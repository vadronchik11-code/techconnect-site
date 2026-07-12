'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

async function guard() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? '').trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parse(formData: FormData) {
  const dateRaw = String(formData.get('date') ?? '').trim();
  return {
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    coverImage: String(formData.get('coverImage') ?? '').trim() || null,
    participants: numOrNull(formData.get('participants')),
    partnersCount: numOrNull(formData.get('partnersCount')),
    resultText: String(formData.get('resultText') ?? '').trim() || null,
    date: dateRaw ? new Date(dateRaw) : null,
    order: Number(formData.get('order') ?? 0) || 0,
  };
}

export async function createPortfolio(formData: FormData) {
  await guard();
  const data = parse(formData);
  if (!data.title) throw new Error('Название обязательно');
  await prisma.portfolioItem.create({ data });
  revalidatePath('/portfolio');
  revalidatePath('/admin/portfolio');
  redirect('/admin/portfolio');
}

export async function updatePortfolio(id: string, formData: FormData) {
  await guard();
  const data = parse(formData);
  if (!data.title) throw new Error('Название обязательно');
  await prisma.portfolioItem.update({ where: { id }, data });
  revalidatePath('/portfolio');
  revalidatePath('/admin/portfolio');
  redirect('/admin/portfolio');
}

export async function deletePortfolio(id: string) {
  await guard();
  await prisma.portfolioItem.delete({ where: { id } });
  revalidatePath('/portfolio');
  revalidatePath('/admin/portfolio');
}

export async function reorderPortfolio(orderedIds: string[]) {
  await guard();
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.portfolioItem.update({ where: { id }, data: { order: index } }))
  );
  revalidatePath('/portfolio');
  revalidatePath('/admin/portfolio');
}
