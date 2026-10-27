import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import { env } from '../../config/env';
import { prisma } from '../../db/prisma';
import type { AuthUser } from '../../auth/types';
import { assertCanManageClass, isAdmin } from '../../auth/permissions';
import { badRequest, conflict, notFound } from '../../utils/httpError';
import { sendEmail } from '../../services/email';
import { publicUser } from '../shared/serializers';
import { createKalla, updateKalla } from '../kallot/kallot.service';
import { createKallaSchema, updateKallaSchema } from '../kallot/kallot.schemas';
import type { reportSchema, reviewSchema } from './requests.schemas';

/** בוגרת שולחת דיווח ״התארסתי״ או עדכון לפרטים שלה */
export async function createReport(user: AuthUser, input: z.infer<typeof reportSchema>) {
  if (!user.classId) throw badRequest('המשתמשת לא משויכת לכיתה');
  const myKalla = await prisma.kalla.findUnique({ where: { userId: user.id } });
  if (input.type === 'NEW' && myKalla) throw conflict('כבר רשומה כלה על שמך. שלחי דיווח מסוג עדכון');
  if (input.type === 'UPDATE' && !myKalla) throw conflict('עוד אין כלה על שמך. שלחי דיווח ״התארסתי״');
  const pending = await prisma.updateRequest.findFirst({ where: { userId: user.id, status: 'PENDING' } });
  if (pending) throw conflict('יש לך כבר דיווח שממתין לאישור');

  const request = await prisma.updateRequest.create({
    data: { userId: user.id, classId: user.classId, type: input.type, data: input.data as Prisma.InputJsonValue },
  });
  await notifyClassManagers(user.classId, user.yearbookId, `דיווח חדש מ${user.name}`, `${user.name} שלחה דיווח שממתין לאישור.\n${env.FRONTEND_URL}/admin`);
  return request;
}

export async function myReports(user: AuthUser) {
  return prisma.updateRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
}

/** מה שמחכה לאישור: דיווחים והרשמות. נציגה רואה רק את הכיתה שלה */
export async function pendingForReview(user: AuthUser) {
  const classFilter = isAdmin(user) ? { classGroup: { yearbookId: user.yearbookId } } : { classId: user.classId ?? '-' };
  const [reports, registrations] = await Promise.all([
    prisma.updateRequest.findMany({
      where: { status: 'PENDING', ...classFilter },
      include: { user: { select: { id: true, name: true } }, classGroup: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.user.findMany({
      where: { status: 'PENDING', yearbookId: user.yearbookId, ...(isAdmin(user) ? {} : { classId: user.classId ?? '-' }) },
      include: { classGroup: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ]);
  return {
    reports: reports.map((r) => ({
      id: r.id,
      type: r.type,
      data: r.data,
      createdAt: r.createdAt,
      user: r.user,
      className: r.classGroup.name,
    })),
    registrations: registrations.map((u) => ({ ...publicUser(u), className: u.classGroup?.name ?? null })),
  };
}

/**
 * אישור או דחייה של דיווח. אם שתי נציגות מאשרות יחד, רק הראשונה מצליחה,
 * והשנייה מקבלת 409 עם שם מי שטיפלה.
 */
export async function reviewReport(user: AuthUser, id: string, input: z.infer<typeof reviewSchema>) {
  const req = await prisma.updateRequest.findFirst({
    where: { id, classGroup: { yearbookId: user.yearbookId } },
    include: { user: true, reviewedBy: { select: { name: true } } },
  });
  if (!req) throw notFound('הדיווח לא נמצא');
  assertCanManageClass(user, req.classId);
  if (req.status !== 'PENDING') throw conflict(`הדיווח כבר טופל${req.reviewedBy ? ` על ידי ${req.reviewedBy.name}` : ''}`);

  const newStatus = input.action === 'approve' ? 'APPROVED' : 'DECLINED';
  const claimed = await prisma.updateRequest.updateMany({
    where: { id, status: 'PENDING' },
    data: { status: newStatus, reviewedById: user.id, reviewedAt: new Date(), note: input.note },
  });
  if (claimed.count === 0) {
    const now = await prisma.updateRequest.findUnique({ where: { id }, include: { reviewedBy: { select: { name: true } } } });
    throw conflict(`הדיווח כבר טופל${now?.reviewedBy ? ` על ידי ${now.reviewedBy.name}` : ''}`);
  }

  let kalla: unknown = null;
  if (input.action === 'approve') {
    try {
      if (req.type === 'NEW') {
        const data = createKallaSchema.parse({ ...(req.data as object), userId: req.userId });
        kalla = await createKalla(user, req.classId, data);
      } else {
        const mine = await prisma.kalla.findUnique({ where: { userId: req.userId } });
        if (!mine) throw conflict('לא נמצאה כלה לעדכן');
        kalla = await updateKalla(user, mine.id, updateKallaSchema.parse(req.data));
      }
    } catch (err) {
      // אם יצירת הכלה נכשלה, הדיווח חוזר להמתנה
      await prisma.updateRequest.update({
        where: { id },
        data: { status: 'PENDING', reviewedById: null, reviewedAt: null, note: null },
      });
      throw err;
    }
  }

  await sendEmail({
    to: req.user.email,
    template: input.action === 'approve' ? 'report-approved' : 'report-declined',
    subject: input.action === 'approve' ? 'הדיווח שלך אושר. מזל טוב!' : 'הדיווח שלך לא אושר',
    text:
      input.action === 'approve'
        ? `הפרטים שלך עודכנו בשנתון.${input.note ? `\nהערה: ${input.note}` : ''}`
        : `נציגת הכיתה לא אישרה את הדיווח.${input.note ? `\nהערה: ${input.note}` : ''}`,
  });
  return { status: newStatus, kalla };
}

/** אישור או דחייה של הרשמה. דחייה מוחקת את החשבון הממתין */
export async function reviewRegistration(user: AuthUser, userId: string, action: 'approve' | 'decline') {
  const u = await prisma.user.findFirst({ where: { id: userId, yearbookId: user.yearbookId } });
  if (!u) throw notFound('המשתמשת לא נמצאה');
  if (u.status !== 'PENDING') throw conflict('ההרשמה כבר טופלה');
  if (!u.classId) throw badRequest('המשתמשת לא משויכת לכיתה');
  assertCanManageClass(user, u.classId);
  if (action === 'decline') {
    await prisma.user.delete({ where: { id: u.id } });
    return { status: 'DECLINED' as const };
  }
  const updated = await prisma.user.update({ where: { id: u.id }, data: { status: 'ACTIVE' } });
  await sendEmail({
    to: u.email,
    template: 'welcome',
    subject: 'ברוכה הבאה לשנתון הכלות',
    text: `ההרשמה שלך אושרה. אפשר להתחבר: ${env.FRONTEND_URL}/login`,
  });
  return { status: 'ACTIVE' as const, user: publicUser(updated) };
}

async function notifyClassManagers(classId: string, yearbookId: string, subject: string, text: string) {
  const reps = await prisma.user.findMany({ where: { role: 'REP', classId, status: 'ACTIVE' } });
  const to = reps.length ? reps : await prisma.user.findMany({ where: { role: 'ADMIN', yearbookId, status: 'ACTIVE' } });
  await Promise.all(to.map((r) => sendEmail({ to: r.email, template: 'new-report', subject, text })));
}
