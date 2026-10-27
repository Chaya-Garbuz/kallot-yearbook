import type { AuthUser } from './types';
import { forbidden } from '../utils/httpError';

// כל כללי ההרשאות במקום אחד, לפי טבלת ההרשאות באפיון

export const isAdmin = (u: AuthUser) => u.role === 'ADMIN';
export const isRepOf = (u: AuthUser, classId: string) => u.role === 'REP' && u.classId === classId;

/** מנהלת: כל כיתה. נציגה: רק הכיתה שלה */
export function canManageClass(u: AuthUser, classId: string): boolean {
  return isAdmin(u) || isRepOf(u, classId);
}

export function assertCanManageClass(u: AuthUser, classId: string): void {
  if (!canManageClass(u, classId)) throw forbidden('אפשר לעדכן רק את הכיתה שלך');
}

/** תאריך חתונה ואולם: מנהלת, נציגת הכיתה, או הכלה עצמה */
export function canEditWedding(u: AuthUser, kalla: { classId: string; userId: string | null }): boolean {
  return canManageClass(u, kalla.classId) || (kalla.userId !== null && kalla.userId === u.id);
}

/** מי רואה תאריך חתונה מוסתר: מנהלת והכלה עצמה */
export function canSeeHiddenWedding(u: AuthUser, kalla: { userId: string | null }): boolean {
  return isAdmin(u) || (kalla.userId !== null && kalla.userId === u.id);
}

/** הסתרת ברכה: מנהלת, נציגת הכיתה, או הכלה עצמה */
export function canHideBlessing(u: AuthUser, kalla: { classId: string; userId: string | null }): boolean {
  return canEditWedding(u, kalla);
}

export const BLESSING_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

/** עריכה ומחיקה של ברכה: הכותבת ב־24 השעות הראשונות, ומנהלת תמיד */
export function canEditBlessing(u: AuthUser, b: { authorId: string; createdAt: Date }, now = new Date()): boolean {
  if (isAdmin(u)) return true;
  return b.authorId === u.id && now.getTime() - b.createdAt.getTime() <= BLESSING_EDIT_WINDOW_MS;
}
