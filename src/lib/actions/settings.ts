'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { Lead } from '@/lib/settings';

async function guard() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
}

const MAX_LEADS = 8;

export async function saveSettings(formData: FormData) {
  await guard();

  const simple: Record<string, string> = {
    telegram: String(formData.get('telegram') ?? '').trim(),
    vk: String(formData.get('vk') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim(),
    address: String(formData.get('address') ?? '').trim(),
    aboutText: String(formData.get('aboutText') ?? '').trim(),
    statParticipants: String(formData.get('statParticipants') ?? '').trim(),
  };

  const leadership: Lead[] = [];
  for (let i = 0; i < MAX_LEADS; i++) {
    const name = String(formData.get(`lead_name_${i}`) ?? '').trim();
    const role = String(formData.get(`lead_role_${i}`) ?? '').trim();
    const tg = String(formData.get(`lead_tg_${i}`) ?? '').trim();
    const vk = String(formData.get(`lead_vk_${i}`) ?? '').trim();
    if (name) leadership.push({ name, role, ...(tg ? { tg } : {}), ...(vk ? { vk } : {}) });
  }

  const entries: Array<[string, string]> = [
    ...Object.entries(simple),
    ['leadership', JSON.stringify(leadership)],
  ];

  await Promise.all(
    entries.map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
    )
  );

  revalidatePath('/');
  revalidatePath('/contacts');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?saved=1');
}
