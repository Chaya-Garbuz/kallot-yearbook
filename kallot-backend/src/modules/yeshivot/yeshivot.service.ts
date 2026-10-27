import type { z } from 'zod';
import { prisma } from '../../db/prisma';
import type { AuthUser } from '../../auth/types';
import { isAdmin } from '../../auth/permissions';
import { badRequest, conflict, notFound } from '../../utils/httpError';
import { normalizeName, yeshivaStats } from '../../utils/stats';
import type { createYeshivaSchema, mergeYeshivotSchema, updateYeshivaSchema } from './yeshivot.schemas';

/** חיפוש להשלמה אוטומטית: בשם ובשמות הנוספים, בלי תלות ברווחים ובסוג הגרש */
export async function searchYeshivot(user: AuthUser, q?: string, includePending = false) {
  const all = await prisma.yeshiva.findMany({
    where: includePending && isAdmin(user) ? {} : { isApproved: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, aliases: true, isApproved: true },
  });
  if (!q) return all;
  const nq = normalizeName(q);
  return all.filter((y) => [y.name, ...y.aliases].some((n) => normalizeName(n).includes(nq)));
}

/** מחפש ישיבה קיימת לפי שם או שם נוסף */
async function findByAnyName(name: string) {
  const n = normalizeName(name);
  const all = await prisma.yeshiva.findMany({ select: { id: true, name: true, aliases: true } });
  return all.find((y) => [y.name, ...y.aliases].some((x) => normalizeName(x) === n));
}

/** מנהלת: נוספת מאושרת. נציגה: נוספת כהצעה שממתינה לאישור המנהלת */
export async function createYeshiva(user: AuthUser, input: z.infer<typeof createYeshivaSchema>) {
  const existing = await findByAnyName(input.name);
  if (existing) throw conflict(`הישיבה כבר קיימת ברשימה בשם ״${existing.name}״`);
  return prisma.yeshiva.create({
    data: { name: input.name, aliases: input.aliases ?? [], isApproved: isAdmin(user) },
  });
}

export async function updateYeshiva(id: string, input: z.infer<typeof updateYeshivaSchema>) {
  const y = await prisma.yeshiva.findUnique({ where: { id } });
  if (!y) throw notFound('הישיבה לא נמצאה');
  if (input.name && input.name !== y.name) {
    const other = await findByAnyName(input.name);
    if (other && other.id !== y.id) throw conflict(`כבר יש ישיבה בשם ״${other.name}״`);
  }
  return prisma.yeshiva.update({ where: { id }, data: input });
}

/** איחוד כפילויות: כל הכלות עוברות לישיבה הראשית, השמות הישנים נשמרים כשמות נוספים */
export async function mergeYeshivot(input: z.infer<typeof mergeYeshivotSchema>) {
  if (input.sourceIds.includes(input.targetId)) throw badRequest('אי אפשר לאחד ישיבה עם עצמה');
  const target = await prisma.yeshiva.findUnique({ where: { id: input.targetId } });
  if (!target) throw notFound('הישיבה הראשית לא נמצאה');
  const sources = await prisma.yeshiva.findMany({ where: { id: { in: input.sourceIds } } });
  if (sources.length !== input.sourceIds.length) throw notFound('חלק מהישיבות לאיחוד לא נמצאו');

  const aliases = new Set([...target.aliases, ...sources.flatMap((s) => [s.name, ...s.aliases])]);
  aliases.delete(target.name);

  return prisma.$transaction(async (tx) => {
    const moved = await tx.kalla.updateMany({ where: { yeshivaId: { in: input.sourceIds } }, data: { yeshivaId: target.id } });
    await tx.yeshiva.deleteMany({ where: { id: { in: input.sourceIds } } });
    const updated = await tx.yeshiva.update({
      where: { id: target.id },
      data: { aliases: [...aliases].slice(0, 30), isApproved: true },
    });
    return { yeshiva: updated, movedKallot: moved.count };
  });
}

/** כמה כלות מכל ישיבה: בשנתון, בכיתה או בהתמחות. רק ישיבות מאושרות */
export async function stats(user: AuthUser, classId?: string, specializationId?: string) {
  const kallot = await prisma.kalla.findMany({
    where: {
      classGroup: { yearbookId: user.yearbookId },
      yeshiva: { isApproved: true },
      ...(classId ? { classId } : {}),
      ...(specializationId ? { specializationId } : {}),
    },
    select: { id: true, name: true, yeshivaId: true, classGroup: { select: { name: true } }, yeshiva: { select: { name: true } } },
  });
  const rows = yeshivaStats(kallot.map((k) => ({ yeshivaId: k.yeshivaId, yeshivaName: k.yeshiva.name })));
  return {
    totalKallot: kallot.length,
    yeshivot: rows.map((r) => ({
      ...r,
      kallot: kallot
        .filter((k) => k.yeshivaId === r.yeshivaId)
        .map((k) => ({ id: k.id, name: k.name, className: k.classGroup.name })),
    })),
  };
}
