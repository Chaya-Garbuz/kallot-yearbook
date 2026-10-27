import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import { env } from '../../config/env';
import { prisma } from '../../db/prisma';
import type { AuthUser } from '../../auth/types';
import { assertCanManageClass, canEditWedding, isAdmin } from '../../auth/permissions';
import { badRequest, conflict, forbidden, notFound } from '../../utils/httpError';
import { parseDateOnly, todayInZone } from '../../utils/dates';
import { percent } from '../../utils/stats';
import { kallaInclude, serializeKalla } from '../shared/serializers';
import { getClassOr404 } from '../classes/classes.service';
import type { createKallaSchema, listKallotQuery, updateKallaSchema, weddingSchema } from './kallot.schemas';

type CreateInput = z.infer<typeof createKallaSchema>;

async function getKallaOr404(user: AuthUser, id: string) {
  const k = await prisma.kalla.findFirst({ where: { id, classGroup: { yearbookId: user.yearbookId } }, include: kallaInclude });
  if (!k) throw notFound('הכלה לא נמצאה');
  return k;
}

/** בדיקות תאריכים: אירוסין לא בעתיד, חתונה אחרי האירוסין */
function checkDates(engagedAt: Date, weddingAt: Date | null | undefined) {
  const today = todayInZone(env.TIMEZONE);
  if (engagedAt.getTime() > today.getTime()) {
    throw badRequest('תאריך האירוסין לא יכול להיות בעתיד', [{ field: 'engagedAt', message: 'תאריך בעתיד' }]);
  }
  if (weddingAt && weddingAt.getTime() <= engagedAt.getTime()) {
    throw badRequest('תאריך החתונה חייב להיות אחרי תאריך האירוסין', [{ field: 'weddingAt', message: 'לפני האירוסין' }]);
  }
}

/** מוודא שיש מקום בכיתה ובהתמחות, כדי שהאחוז לא יעבור את 100 */
async function checkCapacity(classId: string, specializationId: string, excludeKallaId?: string) {
  const not = excludeKallaId ? { id: { not: excludeKallaId } } : {};
  const [cls, spec, inClass, inSpec] = await Promise.all([
    prisma.classGroup.findUniqueOrThrow({ where: { id: classId } }),
    prisma.specialization.findUniqueOrThrow({ where: { id: specializationId } }),
    prisma.kalla.count({ where: { classId, ...not } }),
    prisma.kalla.count({ where: { specializationId, ...not } }),
  ]);
  if (inClass + 1 > cls.size) throw conflict(`בכיתה ${cls.name} רשומות כבר ${inClass} כלות מתוך ${cls.size} בנות. עדכני קודם את מספר הבנות`);
  if (inSpec + 1 > spec.size) throw conflict(`בהתמחות ${spec.name} רשומות כבר ${inSpec} כלות מתוך ${spec.size} בנות. עדכני קודם את מספר הבנות`);
}

async function checkRefs(user: AuthUser, specializationId?: string, yeshivaId?: string) {
  if (specializationId) {
    const s = await prisma.specialization.findFirst({ where: { id: specializationId, yearbookId: user.yearbookId } });
    if (!s) throw badRequest('ההתמחות לא נמצאה', [{ field: 'specializationId', message: 'לא נמצאה' }]);
  }
  if (yeshivaId) {
    const y = await prisma.yeshiva.findUnique({ where: { id: yeshivaId } });
    if (!y) throw badRequest('הישיבה לא נמצאה', [{ field: 'yeshivaId', message: 'לא נמצאה' }]);
  }
}

async function checkLinkedUser(classId: string, userId: string | null | undefined, excludeKallaId?: string) {
  if (!userId) return;
  const u = await prisma.user.findUnique({ where: { id: userId }, include: { kalla: { select: { id: true } } } });
  if (!u || u.classId !== classId) throw badRequest('המשתמשת לא שייכת לכיתה הזו', [{ field: 'userId', message: 'לא בכיתה' }]);
  if (u.kalla && u.kalla.id !== excludeKallaId) throw conflict('המשתמשת הזו כבר מקושרת לכלה אחרת');
}

export async function listKallot(user: AuthUser, q: z.infer<typeof listKallotQuery>) {
  const where: Prisma.KallaWhereInput = {
    classGroup: { yearbookId: user.yearbookId },
    ...(q.classId ? { classId: q.classId } : {}),
    ...(q.specializationId ? { specializationId: q.specializationId } : {}),
    ...(q.yeshivaId ? { yeshivaId: q.yeshivaId } : {}),
    ...(q.q ? { name: { contains: q.q, mode: 'insensitive' as const } } : {}),
    ...(q.hasWedding === 'true' ? { weddingAt: { not: null }, hideWeddingDate: false } : {}),
    ...(q.hasWedding === 'false' ? { weddingAt: null } : {}),
  };
  const orderBy: Prisma.KallaOrderByWithRelationInput =
    q.sort === 'className'
      ? { classGroup: { name: q.order } }
      : q.sort === 'weddingAt'
        ? { weddingAt: { sort: q.order, nulls: 'last' } }
        : q.sort === 'name'
          ? { name: q.order }
          : { engagedAt: q.order };
  const [total, rows] = await Promise.all([
    prisma.kalla.count({ where }),
    prisma.kalla.findMany({
      where,
      include: kallaInclude,
      orderBy: q.sort === 'name' || q.sort === 'className' ? [orderBy] : [orderBy, { name: 'asc' }],
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
  ]);
  return { total, page: q.page, pageSize: q.pageSize, items: rows.map((k) => serializeKalla(k, user)) };
}

export async function getKalla(user: AuthUser, id: string) {
  return serializeKalla(await getKallaOr404(user, id), user);
}

export async function listByClass(user: AuthUser, classId: string) {
  const cls = await getClassOr404(user, classId);
  const kallot = await prisma.kalla.findMany({ where: { classId: cls.id }, include: kallaInclude, orderBy: { engagedAt: 'desc' } });
  return {
    class: { id: cls.id, name: cls.name, size: cls.size, kallotCount: kallot.length, percent: percent(kallot.length, cls.size) },
    kallot: kallot.map((k) => serializeKalla(k, user)),
  };
}

export async function createKalla(user: AuthUser, classId: string, input: CreateInput) {
  const cls = await getClassOr404(user, classId);
  assertCanManageClass(user, cls.id);
  await checkRefs(user, input.specializationId, input.yeshivaId);
  const engagedAt = parseDateOnly(input.engagedAt);
  const weddingAt = input.weddingAt ? parseDateOnly(input.weddingAt) : null;
  checkDates(engagedAt, weddingAt);
  const dup = await prisma.kalla.findFirst({ where: { classId: cls.id, name: input.name } });
  if (dup) throw conflict('כלה בשם הזה כבר רשומה בכיתה. אפשר לערוך את הקיימת');
  await checkCapacity(cls.id, input.specializationId);
  await checkLinkedUser(cls.id, input.userId);

  const k = await prisma.kalla.create({
    data: {
      classId: cls.id,
      specializationId: input.specializationId,
      yeshivaId: input.yeshivaId,
      userId: input.userId ?? null,
      name: input.name,
      engagedAt,
      weddingAt,
      hallName: input.hallName ?? null,
      hallCity: input.hallCity ?? null,
      hideWeddingDate: input.hideWeddingDate ?? false,
      createdById: user.id,
      updatedById: user.id,
    },
    include: kallaInclude,
  });
  const count = await prisma.kalla.count({ where: { classId: cls.id } });
  return { ...serializeKalla(k, user), classPercent: percent(count, cls.size) };
}

export async function updateKalla(user: AuthUser, id: string, input: z.infer<typeof updateKallaSchema>) {
  const k = await getKallaOr404(user, id);
  assertCanManageClass(user, k.classId);
  if (input.classId && input.classId !== k.classId) {
    if (!isAdmin(user)) throw forbidden('רק המנהלת יכולה להעביר כלה לכיתה אחרת');
    await getClassOr404(user, input.classId);
  }
  await checkRefs(user, input.specializationId, input.yeshivaId);
  const classId = input.classId ?? k.classId;
  const specializationId = input.specializationId ?? k.specializationId;
  const engagedAt = input.engagedAt ? parseDateOnly(input.engagedAt) : k.engagedAt;
  const weddingAt =
    input.weddingAt === undefined ? k.weddingAt : input.weddingAt === null ? null : parseDateOnly(input.weddingAt);
  checkDates(engagedAt, weddingAt);
  const name = input.name ?? k.name;
  if (name !== k.name || classId !== k.classId) {
    const dup = await prisma.kalla.findFirst({ where: { classId, name, id: { not: k.id } } });
    if (dup) throw conflict('כלה בשם הזה כבר רשומה בכיתה');
  }
  if (classId !== k.classId || specializationId !== k.specializationId) await checkCapacity(classId, specializationId, k.id);
  if (input.userId !== undefined) await checkLinkedUser(classId, input.userId, k.id);

  const weddingChanged = (weddingAt?.getTime() ?? null) !== (k.weddingAt?.getTime() ?? null);
  const updated = await prisma.$transaction(async (tx) => {
    if (weddingChanged) {
      // תאריך חדש: התזכורות יישלחו שוב לפי התאריך החדש
      await tx.reminderSubscription.updateMany({ where: { kallaId: k.id }, data: { sentBeforeAt: null, sentDayAt: null } });
    }
    return tx.kalla.update({
      where: { id: k.id },
      data: {
        name,
        classId,
        specializationId,
        yeshivaId: input.yeshivaId,
        engagedAt,
        weddingAt,
        hallName: input.hallName,
        hallCity: input.hallCity,
        hideWeddingDate: input.hideWeddingDate,
        userId: input.userId,
        updatedById: user.id,
      },
      include: kallaInclude,
    });
  });
  return serializeKalla(updated, user);
}

/** תאריך חתונה ואולם: גם הכלה עצמה יכולה לעדכן */
export async function updateWedding(user: AuthUser, id: string, input: z.infer<typeof weddingSchema>) {
  const k = await getKallaOr404(user, id);
  if (!canEditWedding(user, k)) throw forbidden('אפשר לעדכן רק את החתונה שלך או של כלה מהכיתה שלך');
  const weddingAt =
    input.weddingAt === undefined ? k.weddingAt : input.weddingAt === null ? null : parseDateOnly(input.weddingAt);
  checkDates(k.engagedAt, weddingAt);
  const weddingChanged = (weddingAt?.getTime() ?? null) !== (k.weddingAt?.getTime() ?? null);
  const updated = await prisma.$transaction(async (tx) => {
    if (weddingChanged) {
      await tx.reminderSubscription.updateMany({ where: { kallaId: k.id }, data: { sentBeforeAt: null, sentDayAt: null } });
    }
    return tx.kalla.update({
      where: { id: k.id },
      data: {
        weddingAt,
        hallName: input.hallName,
        hallCity: input.hallCity,
        hideWeddingDate: input.hideWeddingDate,
        updatedById: user.id,
      },
      include: kallaInclude,
    });
  });
  return serializeKalla(updated, user);
}

export async function deleteKalla(user: AuthUser, id: string) {
  const k = await getKallaOr404(user, id);
  assertCanManageClass(user, k.classId);
  await prisma.kalla.delete({ where: { id: k.id } });
}
