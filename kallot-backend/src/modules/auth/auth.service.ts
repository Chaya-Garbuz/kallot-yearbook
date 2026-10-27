import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { z } from 'zod';
import { env } from '../../config/env';
import { prisma } from '../../db/prisma';
import { signToken } from '../../auth/jwt';
import { hashPassword, verifyPassword } from '../../auth/password';
import type { AuthUser } from '../../auth/types';
import { assertNotLocked, clearLoginFailures, recordLoginFailure } from '../../middleware/rateLimit';
import { badRequest, conflict, HttpError, notFound, unauthorized } from '../../utils/httpError';
import { sendEmail } from '../../services/email';
import { publicUser } from '../shared/serializers';
import type { loginSchema, registerSchema, updateMeSchema } from './auth.schemas';

export async function register(input: z.infer<typeof registerSchema>) {
  const yearbook = await prisma.yearbook.findUnique({ where: { joinCode: input.joinCode } });
  if (!yearbook || yearbook.isArchived) throw badRequest('הקוד לא נמצא, בדקי עם רכזת המחזור');
  const cls = await prisma.classGroup.findFirst({ where: { id: input.classId, yearbookId: yearbook.id } });
  if (!cls) throw badRequest('הכיתה לא נמצאה בשנתון הזה');
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) throw conflict('המייל הזה כבר רשום במערכת');

  const user = await prisma.user.create({
    data: {
      yearbookId: yearbook.id,
      classId: cls.id,
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: 'GRADUATE',
      status: 'ACTIVE', // נכנסת מיד, בלי לחכות לאישור של נציגת הכיתה
    },
  });

  // הודעה (לידיעה בלבד) לנציגות הכיתה, ואם אין - למנהלות
  const reps = await prisma.user.findMany({ where: { role: 'REP', classId: cls.id, status: 'ACTIVE' } });
  const notify = reps.length
    ? reps
    : await prisma.user.findMany({ where: { role: 'ADMIN', yearbookId: yearbook.id, status: 'ACTIVE' } });
  await Promise.all(
    notify.map((r) =>
      sendEmail({
        to: r.email,
        template: 'new-registration',
        subject: `הצטרפה לשנתון: ${user.name}`,
        text: `${user.name} מכיתה ${cls.name} נרשמה לאתר והצטרפה לשנתון.\nאם היא לא שייכת למחזור, המנהלת יכולה לחסום אותה: ${env.FRONTEND_URL}/admin`,
      }),
    ),
  );
  // מחוברת מיד אחרי ההרשמה, כמו אחרי כניסה
  return { token: signToken(user.id), user: publicUser(user) };
}

export async function login(input: z.infer<typeof loginSchema>) {
  assertNotLocked(input.email);
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    recordLoginFailure(input.email);
    throw unauthorized('מייל או סיסמה שגויים');
  }
  clearLoginFailures(input.email);
  if (user.status === 'PENDING') throw new HttpError(403, 'PENDING', 'החשבון עוד ממתין לאישור של נציגת הכיתה');
  if (user.status === 'BLOCKED') throw new HttpError(403, 'BLOCKED', 'החשבון חסום. פני לרכזת המחזור');
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return { token: signToken(user.id), user: publicUser(user) };
}

export async function me(auth: AuthUser) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: auth.id },
    include: {
      classGroup: { select: { id: true, name: true } },
      yearbook: { select: { id: true, name: true, hebrewYear: true } },
      kalla: { select: { id: true } },
    },
  });
  return {
    ...publicUser(user),
    className: user.classGroup?.name ?? null,
    yearbook: user.yearbook,
    kallaId: user.kalla?.id ?? null,
  };
}

export async function updateMe(auth: AuthUser, input: z.infer<typeof updateMeSchema>) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: auth.id } });
  let passwordHash: string | undefined;
  if (input.newPassword) {
    if (!input.currentPassword || !(await verifyPassword(input.currentPassword, user.passwordHash))) {
      throw badRequest('הסיסמה הנוכחית שגויה', [{ field: 'currentPassword', message: 'הסיסמה הנוכחית שגויה' }]);
    }
    passwordHash = await hashPassword(input.newPassword);
  }
  const updated = await prisma.user.update({
    where: { id: auth.id },
    data: {
      name: input.name,
      blessingEmailPref: input.blessingEmailPref,
      reminderEmails: input.reminderEmails,
      announcementEmails: input.announcementEmails,
      passwordHash,
    },
  });
  return publicUser(updated);
}

// איפוס סיסמה בלי טבלה נוספת: הטוקן כולל קטע מה־hash הנוכחי,
// ולכן אחרי שהסיסמה מוחלפת הוא כבר לא תקף (שימוש חד־פעמי).
const resetFingerprint = (hash: string) => hash.slice(-12);

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.status !== 'BLOCKED') {
    const token = jwt.sign({ sub: user.id, purpose: 'reset', fp: resetFingerprint(user.passwordHash) }, env.JWT_SECRET, {
      expiresIn: '1h',
    });
    await sendEmail({
      to: user.email,
      template: 'password-reset',
      subject: 'איפוס סיסמה לשנתון הכלות',
      text: `לבחירת סיסמה חדשה (הקישור תקף לשעה אחת):\n${env.FRONTEND_URL}/reset-password?token=${token}`,
    });
  }
  // תמיד אותה תשובה, כדי לא לחשוף אילו מיילים רשומים
  return { message: 'אם המייל רשום, נשלח אליו קישור לאיפוס' };
}

export async function resetPassword(token: string, newPassword: string) {
  let payload: JwtPayload;
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded !== 'object' || decoded.purpose !== 'reset') throw new Error('bad');
    payload = decoded;
  } catch {
    throw badRequest('הקישור לא תקף או שפג תוקפו');
  }
  const user = await prisma.user.findUnique({ where: { id: String(payload.sub) } });
  if (!user) throw notFound();
  if (payload.fp !== resetFingerprint(user.passwordHash)) throw badRequest('הקישור כבר נוצל');
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
  return { message: 'הסיסמה עודכנה. אפשר להתחבר' };
}

/** כיתות לטופס ההרשמה, לפי קוד מחזור (לא צריך להתחבר) */
export async function classesForJoinCode(joinCode: string) {
  const yearbook = await prisma.yearbook.findUnique({ where: { joinCode } });
  if (!yearbook || yearbook.isArchived) throw notFound('הקוד לא נמצא, בדקי עם רכזת המחזור');
  const classes = await prisma.classGroup.findMany({
    where: { yearbookId: yearbook.id },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true },
  });
  return { yearbook: { name: yearbook.name, hebrewYear: yearbook.hebrewYear }, classes };
}
