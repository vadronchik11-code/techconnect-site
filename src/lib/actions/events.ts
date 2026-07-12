'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

async function guard() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  return session;
}

const TYPES = ['MEETUP', 'HACKATHON', 'FORUM', 'OTHER'];
const STATUSES = ['PAST', 'ONGOING', 'UPCOMING'];

function parse(formData: FormData) {
  const type = String(formData.get('type') ?? 'MEETUP');
  const status = String(formData.get('status') ?? 'UPCOMING');
  const dateRaw = String(formData.get('date') ?? '').trim();
  return {
    title: String(formData.get('title') ?? '').trim(),
    type: TYPES.includes(type) ? type : 'MEETUP',
    status: STATUSES.includes(status) ? status : 'UPCOMING',
    description: String(formData.get('description') ?? '').trim(),
    location: String(formData.get('location') ?? '').trim() || null,
    date: dateRaw ? new Date(dateRaw) : new Date(),
    coverImage: String(formData.get('coverImage') ?? '').trim() || null,
    registrationUrl: String(formData.get('registrationUrl') ?? '').trim() || null,
    order: Number(formData.get('order') ?? 0) || 0,
    isFinal: formData.get('isFinal') === 'on' || formData.get('isFinal') === 'true',
  };
}

/** Only one event can close the road — clear the flag elsewhere. */
async function clearOtherFinals(exceptId?: string) {
  await prisma.event.updateMany({
    where: exceptId ? { NOT: { id: exceptId } } : {},
    data: { isFinal: false },
  });
}

export async function createEvent(formData: FormData) {
  await guard();
  const data = parse(formData);
  if (!data.title) throw new Error('Название обязательно');
  if (data.isFinal) await clearOtherFinals();
  await prisma.event.create({ data });
  revalidatePath('/events');
  revalidatePath('/admin/events');
  redirect('/admin/events');
}

export async function updateEvent(id: string, formData: FormData) {
  await guard();
  const data = parse(formData);
  if (!data.title) throw new Error('Название обязательно');
  if (data.isFinal) await clearOtherFinals(id);
  await prisma.event.update({ where: { id }, data });
  revalidatePath('/events');
  revalidatePath('/admin/events');
  redirect('/admin/events');
}

export async function deleteEvent(id: string) {
  await guard();
  await prisma.event.delete({ where: { id } });
  revalidatePath('/events');
  revalidatePath('/admin/events');
}

/**
 * Reorders events. Note: the public roadmap sorts by `date` first — `order` only
 * breaks ties between events sharing a date. This reorder is mainly for the
 * admin list itself.
 */
export async function reorderEvents(orderedIds: string[]) {
  await guard();
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.event.update({ where: { id }, data: { order: index } }))
  );
  revalidatePath('/events');
  revalidatePath('/admin/events');
}
