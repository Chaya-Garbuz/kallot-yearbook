import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import { prisma } from '../../db/prisma';
import type { AuthUser } from '../../auth/types';
import { isAdmin } from '../../auth/permissions';
import { badRequest, conflict, forbidden, notFound } from '../../utils/httpError';
import { formatDateOnly, toHebrewDate } from '../../utils/dates';
import { sendEmail } from '../../services/email';
import { publicUser } from '../shared/serializers';
import { getClassOr404 } from '../classes/classes.service';
import type { announcementSchema, listUsersQuery, updateUserSchema } from './admin.schemas';

export async function listUsers(user: AuthUser, q: z.infer<typeof listUsersQuery>) {
  const where: Prisma.UserWhereInput = {
    yearbookId: user.yearbookId,
    ...(q.classId ? { classId: q.classId } : {}),
    ...(q.role ? { role: q.role } : {}),
    ...(q.status ? { status: q.status } : {}),
    ...(q.q
      ? { OR: [{ name: { contains: q.q, mode: 'insensitive' as const } }, { email: { contains: q.q, mode: 'insensitive' as const } }] }
      : {}),
  };
  const users = await prisma.user.findMany({ where, include: { classGroup: { select: { name: true } } }, orderBy: { name: 'asc' } });
  return users.map((u) => ({ ...publicUser(u), className: u.classGroup?.name ?? null, lastLoginAt: u.lastLoginAt }));
}

/** חסימה, החזרה או העברת כיתה. נציגה שעוברת כיתה חוזרת להיות בוגרת רגילה */
export async function updateUser(admin: AuthUser, id: string, input: z.infer<typeof updateUserSchema>) {
  const u = await prisma.user.findFirst({ where: { id, yearbookId: admin.yearbookId } });
  if (!u) throw notFound('המשתמשת לא נמצאה');
  if (u.id === admin.id && input.status === 'BLOCKED') throw badRequest('אי אפשר לחסום את עצמך');
  if (input.classId) await getClassOr404(admin, input.classId);
  const movingRep = u.role === 'REP' && input.classId && input.classId !== u.classId;
  const updated = await prisma.user.update({
    where: { id: u.id },
    data: { status: input.status, classId: input.classId, ...(movingRep ? { role: 'GRADUATE' as const } : {}) },
  });
  return publicUser(updated);
}

export async function listReps(admin: AuthUser, classId: string) {
  const cls = await getClassOr404(admin, classId);
  const reps = await prisma.user.findMany({ where: { classId: cls.id, role: 'REP' }, orderBy: { name: 'asc' } });
  return reps.map(publicUser);
}

/** מינוי נציגה נוספת. אפשר כמה נציגות לכל כיתה */
export async function addRep(admin: AuthUser, classId: string, userId: string) {
  const cls = await getClassOr404(admin, classId);
  const u = await prisma.user.findFirst({ where: { id: userId, yearbookId: admin.yearbookId } });
  if (!u) throw notFound('המשתמשת לא נמצאה');
  if (u.classId !== cls.id) throw badRequest('אפשר למנות לנציגה רק בת מהכיתה הזו');
  if (u.status !== 'ACTIVE') throw badRequest('אפשר למנות רק משתמשת פעילה');
  if (u.role === 'ADMIN') throw conflict('המשתמשת היא מנהלת');
  if (u.role === 'REP') throw conflict('המשתמשת כבר נציגה בכיתה');
  const updated = await prisma.user.update({ where: { id: u.id }, data: { role: 'REP' } });
  return publicUser(updated);
}

export async function removeRep(admin: AuthUser, classId: string, userId: string) {
  const cls = await getClassOr404(admin, classId);
  const u = await prisma.user.findFirst({ where: { id: userId, classId: cls.id, role: 'REP' } });
  if (!u) throw notFound('הנציגה לא נמצאה בכיתה');
  await prisma.user.update({ where: { id: u.id }, data: { role: 'GRADUATE' } });
}

/** הודעה במייל. נציגה שולחת רק לכיתה שלה */
export async function sendAnnouncement(user: AuthUser, input: z.infer<typeof announcementSchema>) {
  let classId = input.classId ?? null;
  if (!isAdmin(user)) {
    if (classId && classId !== user.classId) throw forbidden('נציגה יכולה לשלוח הודעה רק לכיתה שלה');
    classId = user.classId;
  }
  if (classId) await getClassOr404(user, classId);
  const recipients = await prisma.user.findMany({
    where: { yearbookId: user.yearbookId, status: 'ACTIVE', announcementEmails: true, ...(classId ? { classId } : {}) },
    select: { email: true },
  });
  for (const r of recipients) {
    await sendEmail({ to: r.email, template: 'announcement', subject: input.subject, text: `${input.body}\n\n${user.name}` });
  }
  return prisma.announcement.create({
    data: { yearbookId: user.yearbookId, classId, subject: input.subject, body: input.body, sentById: user.id, recipientsCount: recipients.length },
  });
}

export async function listAnnouncements(user: AuthUser) {
  return prisma.announcement.findMany({
    where: { yearbookId: user.yearbookId, ...(isAdmin(user) ? {} : { classId: user.classId }) },
    include: { sentBy: { select: { name: true } }, classGroup: { select: { name: true } } },
    orderBy: { sentAt: 'desc' },
    take: 100,
  });
}

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** קובץ CSV (נפתח באקסל) של כלות הכיתה או השנתון */
export async function exportCsv(user: AuthUser, classId?: string): Promise<{ filename: string; csv: string }> {
  let target = classId;
  if (!isAdmin(user)) {
    if (target && target !== user.classId) throw forbidden('אפשר לייצא רק את הכיתה שלך');
    target = user.classId ?? undefined;
  }
  if (target) await getClassOr404(user, target);
  const kallot = await prisma.kalla.findMany({
    where: { classGroup: { yearbookId: user.yearbookId }, ...(target ? { classId: target } : {}) },
    include: { classGroup: true, specialization: true, yeshiva: true },
    orderBy: [{ classGroup: { name: 'asc' } }, { name: 'asc' }],
  });
  const header = ['שם', 'כיתה', 'התמחות', 'ישיבה', 'אירוסין', 'אירוסין (עברי)', 'חתונה', 'חתונה (עברי)', 'אולם', 'עיר'];
  const rows = kallot.map((k) => {
    const show = !k.hideWeddingDate || isAdmin(user);
    return [
      k.name,
      k.classGroup.name,
      k.specialization.name,
      k.yeshiva.name,
      formatDateOnly(k.engagedAt),
      toHebrewDate(k.engagedAt),
      show && k.weddingAt ? formatDateOnly(k.weddingAt) : '',
      show && k.weddingAt ? toHebrewDate(k.weddingAt) : '',
      show ? k.hallName : '',
      show ? k.hallCity : '',
    ];
  });
  // BOM בהתחלה כדי שאקסל יציג עברית נכון
  const csv = '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  return { filename: `kallot-${target ? 'class' : 'yearbook'}-${formatDateOnly(new Date())}.csv`, csv };
}
