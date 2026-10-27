import type { z } from 'zod';
import { prisma } from '../../db/prisma';
import type { AuthUser } from '../../auth/types';
import { assertCanManageClass, isAdmin } from '../../auth/permissions';
import { conflict, forbidden, notFound } from '../../utils/httpError';
import { percent } from '../../utils/stats';
import type { createClassSchema, updateClassSchema } from './classes.schemas';

export async function getClassOr404(user: AuthUser, id: string) {
  const cls = await prisma.classGroup.findFirst({ where: { id, yearbookId: user.yearbookId } });
  if (!cls) throw notFound('הכיתה לא נמצאה');
  return cls;
}

export async function listClasses(user: AuthUser) {
  const classes = await prisma.classGroup.findMany({
    where: { yearbookId: user.yearbookId },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: {
      _count: { select: { kallot: true } },
      users: { where: { role: 'REP' }, select: { id: true, name: true } },
    },
  });
  return classes.map((c) => ({
    id: c.id,
    name: c.name,
    size: c.size,
    order: c.order,
    kallotCount: c._count.kallot,
    percent: percent(c._count.kallot, c.size),
    reps: c.users,
  }));
}

export async function createClass(user: AuthUser, input: z.infer<typeof createClassSchema>) {
  const exists = await prisma.classGroup.findFirst({ where: { yearbookId: user.yearbookId, name: input.name } });
  if (exists) throw conflict('כבר יש כיתה בשם הזה');
  return prisma.classGroup.create({
    data: { yearbookId: user.yearbookId, name: input.name, size: input.size, order: input.order ?? 0 },
  });
}

export async function updateClass(user: AuthUser, id: string, input: z.infer<typeof updateClassSchema>) {
  const cls = await getClassOr404(user, id);
  assertCanManageClass(user, cls.id);
  // נציגה יכולה לעדכן רק את מספר הבנות
  if (!isAdmin(user) && (input.name !== undefined || input.order !== undefined)) {
    throw forbidden('נציגה יכולה לעדכן רק את מספר הבנות בכיתה');
  }
  if (input.size !== undefined) {
    const count = await prisma.kalla.count({ where: { classId: cls.id } });
    if (input.size < count) throw conflict(`בכיתה כבר רשומות ${count} כלות, ולכן מספר הבנות לא יכול להיות קטן מזה`);
  }
  if (input.name && input.name !== cls.name) {
    const dup = await prisma.classGroup.findFirst({ where: { yearbookId: user.yearbookId, name: input.name } });
    if (dup) throw conflict('כבר יש כיתה בשם הזה');
  }
  return prisma.classGroup.update({ where: { id: cls.id }, data: input });
}

export async function deleteClass(user: AuthUser, id: string) {
  const cls = await getClassOr404(user, id);
  const count = await prisma.kalla.count({ where: { classId: cls.id } });
  if (count > 0) throw conflict('אי אפשר למחוק כיתה שיש בה כלות');
  await prisma.classGroup.delete({ where: { id: cls.id } });
}
