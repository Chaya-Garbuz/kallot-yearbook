import type { Prisma, User } from '@prisma/client';
import type { AuthUser } from '../../auth/types';
import { canSeeHiddenWedding } from '../../auth/permissions';
import { formatDateOnly, toHebrewDate } from '../../utils/dates';

/** משתמשת בלי סיסמה ובלי שדות פנימיים */
export function publicUser(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    classId: u.classId,
    blessingEmailPref: u.blessingEmailPref,
    reminderEmails: u.reminderEmails,
    announcementEmails: u.announcementEmails,
    createdAt: u.createdAt,
  };
}

export const kallaInclude = {
  classGroup: { select: { id: true, name: true } },
  specialization: { select: { id: true, name: true } },
  yeshiva: { select: { id: true, name: true } },
} satisfies Prisma.KallaInclude;

export type KallaWithRefs = Prisma.KallaGetPayload<{ include: typeof kallaInclude }>;

/**
 * כלה כפי שהיא נשלחת ללקוח.
 * אם הכלה ביקשה להסתיר את תאריך החתונה, התאריך והאולם לא נשלחים
 * לאף אחת חוץ מהמנהלת ומהכלה עצמה.
 */
export function serializeKalla(k: KallaWithRefs, viewer: AuthUser) {
  const showWedding = !k.hideWeddingDate || canSeeHiddenWedding(viewer, k);
  return {
    id: k.id,
    name: k.name,
    classId: k.classId,
    className: k.classGroup.name,
    specializationId: k.specializationId,
    specializationName: k.specialization.name,
    yeshivaId: k.yeshivaId,
    yeshivaName: k.yeshiva.name,
    engagedAt: formatDateOnly(k.engagedAt),
    engagedHebrew: toHebrewDate(k.engagedAt),
    weddingAt: showWedding && k.weddingAt ? formatDateOnly(k.weddingAt) : null,
    weddingHebrew: showWedding && k.weddingAt ? toHebrewDate(k.weddingAt) : null,
    hallName: showWedding ? k.hallName : null,
    hallCity: showWedding ? k.hallCity : null,
    hideWeddingDate: k.hideWeddingDate,
    isMine: k.userId !== null && k.userId === viewer.id,
    updatedAt: k.updatedAt,
  };
}
