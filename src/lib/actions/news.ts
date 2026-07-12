'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { slugifyRu } from '@/lib/utils';

async function guard() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  return session;
}

function parse(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  let slug = String(formData.get('slug') ?? '').trim();
  if (!slug) slug = slugifyRu(title);
  const published = formData.get('published') === 'on' || formData.get('published') === 'true';
  return {
    title,
    slug: slugifyRu(slug),
    excerpt: String(formData.get('excerpt') ?? '').trim(),
    tags: String(formData.get('tags') ?? '').trim(),
    coverImage: String(formData.get('coverImage') ?? '').trim() || null,
    contentMd: String(formData.get('contentMd') ?? ''),
    published,
    publishedAt: published ? new Date() : null,
  };
}

export async function createNews(formData: FormData) {
  const session = await guard();
  const data = parse(formData);
  if (!data.title) throw new Error('Заголовок обязателен');

  // ensure unique slug
  let slug = data.slug;
  let i = 1;
  while (await prisma.news.findUnique({ where: { slug } })) {
    slug = `${data.slug}-${i++}`;
  }

  await prisma.news.create({ data: { ...data, slug, authorId: session.id } });
  revalidatePath('/news');
  revalidatePath('/admin/news');
  redirect('/admin/news');
}

export async function updateNews(id: string, formData: FormData) {
  await guard();
  const data = parse(formData);
  if (!data.title) throw new Error('Заголовок обязателен');

  const existing = await prisma.news.findFirst({ where: { slug: data.slug, NOT: { id } } });
  if (existing) data.slug = `${data.slug}-${Date.now().toString().slice(-4)}`;

  // keep original publishedAt if it was already published
  const current = await prisma.news.findUnique({ where: { id } });
  const publishedAt = data.published ? current?.publishedAt ?? new Date() : null;

  await prisma.news.update({ where: { id }, data: { ...data, publishedAt } });
  revalidatePath('/news');
  revalidatePath(`/news/${data.slug}`);
  revalidatePath('/admin/news');
  redirect('/admin/news');
}

export async function deleteNews(id: string) {
  await guard();
  await prisma.news.delete({ where: { id } });
  revalidatePath('/news');
  revalidatePath('/admin/news');
}
