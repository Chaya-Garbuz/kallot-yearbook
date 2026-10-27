import type { Blessing } from '@prisma/client';
import type { z } from 'zod';
import { env } from '../../config/env';
import { prisma } from '../../db/prisma';
import type { AuthUser } from '../../auth/types';
import { canEditBlessing, canHideBlessing, canSeeHiddenWedding } from '../../auth/permissions';
import { forbidden, notFound } from '../../utils/httpError';
import { toHebrewDate } from '../../utils/dates';
import { sendEmail } from '../../services/email';
import type { createBlessingSchema, updateBlessingSchema } from './albums.schemas';

async function getKallaOr404(user: AuthUser, kallaId: string) {
  const k = await prisma.kalla.findFirst({
    where: { id: kallaId, classGroup: { yearbookId: user.yearbookId } },
    include: { classGroup: { select: { name: true } }, user: true },
  });
  if (!k) throw notFound('הכלה לא נמצאה');
  return k;
}

function serializeBlessing(b: Blessing & { author: { id: string; name: string } }, viewer: AuthUser) {
  return {
    id: b.id,
    kallaId: b.kallaId,
    text: b.text,
    color: b.color,
    author: b.author,
    isHidden: b.isHidden,
    createdAt: b.createdAt,
    editedAt: b.editedAt,
    canEdit: canEditBlessing(viewer, b),
  };
}

/** רשימת האלבומים: כל הכלות עם מספר הברכות הגלויות */
export async function listAlbums(user: AuthUser, q?: string, classId?: string) {
  const kallot = await prisma.kalla.findMany({
    where: {
      classGroup: { yearbookId: user.yearbookId },
      ...(classId ? { classId } : {}),
      ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
    },
    include: {
      classGroup: { select: { name: true } },
      blessings: { where: { isHidden: false }, select: { createdAt: true }, orderBy: { createdAt: 'desc' } },
    },
  });
  return kallot
    .map((k) => ({
      kallaId: k.id,
      name: k.name,
      className: k.classGroup.name,
      blessingsCount: k.blessings.length,
      lastBlessingAt: k.blessings[0]?.createdAt ?? null,
    }))
    .sort((a, b) => (b.lastBlessingAt?.getTime() ?? 0) - (a.lastBlessingAt?.getTime() ?? 0) || a.name.localeCompare(b.name, 'he'));
}

export async function getAlbum(user: AuthUser, kallaId: string, includeHidden: boolean) {
  const k = await getKallaOr404(user, kallaId);
  const mayIncludeHidden = includeHidden && canHideBlessing(user, k);
  const blessings = await prisma.blessing.findMany({
    where: { kallaId: k.id, ...(mayIncludeHidden ? {} : { isHidden: false }) },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const showWedding = !k.hideWeddingDate || canSeeHiddenWedding(user, k);
  return {
    kalla: {
      id: k.id,
      name: k.name,
      className: k.classGroup.name,
      weddingHebrew: showWedding && k.weddingAt ? toHebrewDate(k.weddingAt) : null,
    },
    canModerate: canHideBlessing(user, k),
    blessings: blessings.map((b) => serializeBlessing(b, user)),
  };
}

export async function createBlessing(user: AuthUser, kallaId: string, input: z.infer<typeof createBlessingSchema>) {
  const k = await getKallaOr404(user, kallaId);
  const b = await prisma.blessing.create({
    data: { kallaId: k.id, authorId: user.id, text: input.text, color: input.color ?? 'gold' },
    include: { author: { select: { id: true, name: true } } },
  });
  // כלה שבחרה ״מייל על כל ברכה״ מקבלת מייל מיד. ״פעם ביום״ נשלח במשימה המתוזמנת
  if (k.user && k.user.id !== user.id && k.user.status === 'ACTIVE' && k.user.blessingEmailPref === 'EACH') {
    await sendEmail({
      to: k.user.email,
      template: 'blessing-each',
      subject: `ברכה חדשה באלבום שלך מ${user.name}`,
      text: `${user.name} כתבה לך:\n\n${b.text}\n\nלאלבום: ${env.FRONTEND_URL}/albums/${k.id}`,
    });
    await prisma.blessing.update({ where: { id: b.id }, data: { emailedAt: new Date() } });
  }
  return serializeBlessing(b, user);
}

async function getBlessingOr404(user: AuthUser, id: string) {
  const b = await prisma.blessing.findFirst({
    where: { id, kalla: { classGroup: { yearbookId: user.yearbookId } } },
    include: { author: { select: { id: true, name: true } }, kalla: { select: { classId: true, userId: true } } },
  });
  if (!b) throw notFound('הברכה לא נמצאה');
  return b;
}

export async function updateBlessing(user: AuthUser, id: string, input: z.infer<typeof updateBlessingSchema>) {
  const b = await getBlessingOr404(user, id);
  if (!canEditBlessing(user, b)) throw forbidden('אפשר לערוך ברכה רק ב־24 השעות הראשונות אחרי שנכתבה');
  const updated = await prisma.blessing.update({
    where: { id: b.id },
    data: { ...input, editedAt: new Date() },
    include: { author: { select: { id: true, name: true } } },
  });
  return serializeBlessing(updated, user);
}

export async function deleteBlessing(user: AuthUser, id: string) {
  const b = await getBlessingOr404(user, id);
  if (!canEditBlessing(user, b)) throw forbidden('אפשר למחוק ברכה רק ב־24 השעות הראשונות אחרי שנכתבה');
  await prisma.blessing.delete({ where: { id: b.id } });
}

export async function setHidden(user: AuthUser, id: string, hidden: boolean) {
  const b = await getBlessingOr404(user, id);
  if (!canHideBlessing(user, b.kalla)) throw forbidden('רק הכלה, נציגת הכיתה או המנהלת יכולות להסתיר ברכה');
  const updated = await prisma.blessing.update({
    where: { id: b.id },
    data: { isHidden: hidden, hiddenById: hidden ? user.id : null },
    include: { author: { select: { id: true, name: true } } },
  });
  return serializeBlessing(updated, user);
}
