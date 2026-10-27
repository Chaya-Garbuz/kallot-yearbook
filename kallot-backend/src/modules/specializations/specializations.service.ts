import type { z } from 'zod';
import { prisma } from '../../db/prisma';
import type { AuthUser } from '../../auth/types';
import { conflict, notFound } from '../../utils/httpError';
import { percent, yeshivaStats } from '../../utils/stats';
import { kallaInclude, serializeKalla } from '../shared/serializers';
import type { createSpecializationSchema, updateSpecializationSchema } from './specializations.schemas';

export async function getSpecializationOr404(user: AuthUser, id: string) {
  const s = await prisma.specialization.findFirst({ where: { id, yearbookId: user.yearbookId } });
  if (!s) throw notFound('ההתמחות לא נמצאה');
  return s;
}

export async function listSpecializations(user: AuthUser) {
  return prisma.specialization.findMany({
    where: { yearbookId: user.yearbookId },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, size: true, order: true },
  });
}

/**
 * אחוז מאורסות בכל התמחות, וישיבות מובילות בכל אחת.
 * עם classId: רק הכלות מאותה כיתה (האחוז עדיין מתוך מספר הבנות בהתמחות).
 */
export async function specializationStats(user: AuthUser, classId?: string) {
  const specs = await prisma.specialization.findMany({ where: { yearbookId: user.yearbookId } });
  const kallot = await prisma.kalla.findMany({
    where: { classGroup: { yearbookId: user.yearbookId }, ...(classId ? { classId } : {}) },
    select: { specializationId: true, yeshivaId: true, yeshiva: { select: { name: true, isApproved: true } } },
  });
  return specs
    .map((s) => {
      const mine = kallot.filter((k) => k.specializationId === s.id);
      const approved = mine
        .filter((k) => k.yeshiva.isApproved)
        .map((k) => ({ yeshivaId: k.yeshivaId, yeshivaName: k.yeshiva.name }));
      return {
        id: s.id,
        name: s.name,
        size: s.size,
        kallotCount: mine.length,
        percent: percent(mine.length, s.size),
        topYeshivot: yeshivaStats(approved).slice(0, 3),
      };
    })
    .sort((a, b) => b.percent - a.percent || a.name.localeCompare(b.name, 'he'));
}

export async function kallotInSpecialization(user: AuthUser, id: string) {
  const s = await getSpecializationOr404(user, id);
  const kallot = await prisma.kalla.findMany({
    where: { specializationId: s.id },
    include: kallaInclude,
    orderBy: { engagedAt: 'desc' },
  });
  return { specialization: s, kallot: kallot.map((k) => serializeKalla(k, user)) };
}

export async function createSpecialization(user: AuthUser, input: z.infer<typeof createSpecializationSchema>) {
  const dup = await prisma.specialization.findFirst({ where: { yearbookId: user.yearbookId, name: input.name } });
  if (dup) throw conflict('כבר יש התמחות בשם הזה');
  return prisma.specialization.create({ data: { ...input, order: input.order ?? 0, yearbookId: user.yearbookId } });
}

export async function updateSpecialization(user: AuthUser, id: string, input: z.infer<typeof updateSpecializationSchema>) {
  const s = await getSpecializationOr404(user, id);
  if (input.size !== undefined) {
    const count = await prisma.kalla.count({ where: { specializationId: s.id } });
    if (input.size < count) throw conflict(`בהתמחות כבר רשומות ${count} כלות, ולכן מספר הבנות לא יכול להיות קטן מזה`);
  }
  if (input.name && input.name !== s.name) {
    const dup = await prisma.specialization.findFirst({ where: { yearbookId: user.yearbookId, name: input.name } });
    if (dup) throw conflict('כבר יש התמחות בשם הזה');
  }
  return prisma.specialization.update({ where: { id: s.id }, data: input });
}

export async function deleteSpecialization(user: AuthUser, id: string) {
  const s = await getSpecializationOr404(user, id);
  const count = await prisma.kalla.count({ where: { specializationId: s.id } });
  if (count > 0) throw conflict('אי אפשר למחוק התמחות שיש בה כלות');
  await prisma.specialization.delete({ where: { id: s.id } });
}
