import type { z } from 'zod';
import { prisma } from '../../db/prisma';
import type { AuthUser } from '../../auth/types';
import { canSeeHiddenWedding } from '../../auth/permissions';
import { badRequest } from '../../utils/httpError';
import { kallaInclude, serializeKalla } from '../shared/serializers';
import type { setRemindersSchema } from './reminders.schemas';

export async function myReminders(user: AuthUser) {
  const subs = await prisma.reminderSubscription.findMany({
    where: { userId: user.id },
    include: { kalla: { include: kallaInclude } },
    orderBy: { kalla: { weddingAt: 'asc' } },
  });
  return subs.map((s) => ({ id: s.id, timing: s.timing, kalla: serializeKalla(s.kalla, user) }));
}

/** מחליף את כל רשימת התזכורות של המשתמשת ברשימה החדשה */
export async function setReminders(user: AuthUser, input: z.infer<typeof setRemindersSchema>) {
  const ids = [...new Set(input.items.map((i) => i.kallaId))];
  const kallot = await prisma.kalla.findMany({ where: { id: { in: ids }, classGroup: { yearbookId: user.yearbookId } } });
  if (kallot.length !== ids.length) throw badRequest('חלק מהכלות לא נמצאו');
  const hidden = kallot.filter((k) => k.hideWeddingDate && !canSeeHiddenWedding(user, k));
  if (hidden.length) throw badRequest('אי אפשר להירשם לתזכורת על חתונה שתאריכה מוסתר');

  await prisma.$transaction(async (tx) => {
    await tx.reminderSubscription.deleteMany({ where: { userId: user.id, kallaId: { notIn: ids } } });
    for (const item of input.items) {
      await tx.reminderSubscription.upsert({
        where: { userId_kallaId: { userId: user.id, kallaId: item.kallaId } },
        create: { userId: user.id, kallaId: item.kallaId, timing: item.timing },
        update: { timing: item.timing },
      });
    }
  });
  return myReminders(user);
}
