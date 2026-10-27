import type { ArticleTopic } from '@prisma/client';
import type { z } from 'zod';
import { prisma } from '../../db/prisma';
import type { AuthUser } from '../../auth/types';
import { isAdmin } from '../../auth/permissions';
import { conflict, notFound } from '../../utils/httpError';
import type { createArticleSchema, newsletterSchema, updateArticleSchema } from './content.schemas';

export async function listArticles(user: AuthUser, topic?: ArticleTopic, q?: string) {
  return prisma.article.findMany({
    where: {
      ...(isAdmin(user) ? {} : { isPublished: true }),
      ...(topic ? { topic } : {}),
      ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}),
    },
    select: { id: true, title: true, slug: true, topic: true, isPublished: true, publishedAt: true, updatedAt: true },
    orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
  });
}

export async function getArticle(user: AuthUser, slug: string) {
  const a = await prisma.article.findUnique({ where: { slug } });
  if (!a || (!a.isPublished && !isAdmin(user))) throw notFound('הדף לא נמצא');
  return a;
}

export async function createArticle(user: AuthUser, input: z.infer<typeof createArticleSchema>) {
  if (await prisma.article.findUnique({ where: { slug: input.slug } })) throw conflict('כבר יש דף בכתובת הזו');
  return prisma.article.create({
    data: { ...input, isPublished: input.isPublished ?? false, publishedAt: input.isPublished ? new Date() : null, authorId: user.id },
  });
}

export async function updateArticle(id: string, input: z.infer<typeof updateArticleSchema>) {
  const a = await prisma.article.findUnique({ where: { id } });
  if (!a) throw notFound('הדף לא נמצא');
  if (input.slug && input.slug !== a.slug && (await prisma.article.findUnique({ where: { slug: input.slug } }))) {
    throw conflict('כבר יש דף בכתובת הזו');
  }
  const publishedAt = input.isPublished === true && !a.isPublished ? new Date() : input.isPublished === false ? null : undefined;
  return prisma.article.update({ where: { id }, data: { ...input, publishedAt } });
}

export async function deleteArticle(id: string) {
  const a = await prisma.article.findUnique({ where: { id } });
  if (!a) throw notFound('הדף לא נמצא');
  await prisma.article.delete({ where: { id } });
}

export async function getNewsletter(user: AuthUser) {
  const sub = await prisma.newsletterSubscription.findUnique({ where: { userId: user.id } });
  return { topics: sub?.topics ?? [], isActive: sub?.isActive ?? false };
}

export async function setNewsletter(user: AuthUser, input: z.infer<typeof newsletterSchema>) {
  const isActive = input.isActive ?? input.topics.length > 0;
  const sub = await prisma.newsletterSubscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, topics: input.topics, isActive },
    update: { topics: input.topics, isActive },
  });
  return { topics: sub.topics, isActive: sub.isActive };
}

/** ביטול דיוור מקישור במייל, בלי התחברות */
export async function unsubscribe(token: string) {
  const sub = await prisma.newsletterSubscription.findUnique({ where: { unsubscribeToken: token } });
  if (!sub) throw notFound('הקישור לא תקין');
  await prisma.newsletterSubscription.update({ where: { id: sub.id }, data: { isActive: false } });
  return { message: 'הוסרת מרשימת הדיוור' };
}
