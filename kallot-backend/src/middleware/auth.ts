import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import '../auth/types';
import { verifyToken } from '../auth/jwt';
import { prisma } from '../db/prisma';
import { forbidden, HttpError, unauthorized } from '../utils/httpError';
import type { AuthUser } from '../auth/types';

/**
 * דורש Bearer Token תקין. המשתמשת נטענת ממסד הנתונים בכל בקשה,
 * כך שחסימה או שינוי תפקיד נכנסים לתוקף מיד.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw unauthorized('צריך להתחבר (חסר Bearer Token)');
    const userId = verifyToken(token);
    if (!userId) throw unauthorized('הכניסה לא תקפה או שפג תוקפה. התחברי מחדש');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, status: true, classId: true, yearbookId: true },
    });
    if (!user) throw unauthorized('המשתמשת לא נמצאה');
    if (user.status === 'BLOCKED') throw new HttpError(403, 'BLOCKED', 'החשבון חסום. פני לרכזת המחזור');
    if (user.status === 'PENDING') throw new HttpError(403, 'PENDING', 'החשבון עוד ממתין לאישור');
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };
}

/** מחזיר את המשתמשת המחוברת (אחרי requireAuth) */
export function currentUser(req: Request): AuthUser {
  if (!req.user) throw unauthorized();
  return req.user;
}
