import { env } from '../../config/env';
import { prisma } from '../../db/prisma';
import type { AuthUser } from '../../auth/types';
import { canSeeHiddenWedding } from '../../auth/permissions';
import {
  addDays,
  daysBetween,
  formatDateOnly,
  hebrewMonthLabel,
  hebrewMonthRange,
  parseDateOnly,
  toHebrewDate,
  todayInZone,
} from '../../utils/dates';
import { percent, yeshivaStats } from '../../utils/stats';
import { kallaInclude, serializeKalla } from '../shared/serializers';

/** מסך הסקירה: אחוז השנתון, כיתות, התמחויות, ישיבות מובילות, חתונות קרובות, אחרונות */
export async function overview(user: AuthUser) {
  const [yearbook, classes, specs, kallot] = await Promise.all([
    prisma.yearbook.findUniqueOrThrow({ where: { id: user.yearbookId }, select: { name: true, hebrewYear: true } }),
    prisma.classGroup.findMany({
      where: { yearbookId: user.yearbookId },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { kallot: true } } },
    }),
    prisma.specialization.findMany({
      where: { yearbookId: user.yearbookId },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { kallot: true } } },
    }),
    prisma.kalla.findMany({ where: { classGroup: { yearbookId: user.yearbookId } }, include: kallaInclude }),
  ]);
  const girls = classes.reduce((s, c) => s + c.size, 0);
  const approvedYeshivaIds = new Set(
    (await prisma.yeshiva.findMany({ where: { isApproved: true }, select: { id: true } })).map((y) => y.id),
  );
  const yesh = yeshivaStats(
    kallot.filter((k) => approvedYeshivaIds.has(k.yeshivaId)).map((k) => ({ yeshivaId: k.yeshivaId, yeshivaName: k.yeshiva.name })),
  );
  const recent = [...kallot].sort((a, b) => b.engagedAt.getTime() - a.engagedAt.getTime()).slice(0, 5);

  return {
    yearbook,
    totals: { kallot: kallot.length, girls, percent: percent(kallot.length, girls), classes: classes.length, yeshivot: yesh.length },
    classes: classes.map((c) => ({ id: c.id, name: c.name, size: c.size, kallotCount: c._count.kallot, percent: percent(c._count.kallot, c.size) })),
    specializations: specs.map((s) => ({ id: s.id, name: s.name, size: s.size, kallotCount: s._count.kallot, percent: percent(s._count.kallot, s.size) })),
    topYeshivot: yesh.slice(0, 6),
    upcomingWeddings: (await upcomingWeddings(user, 60)).slice(0, 10),
    recentEngagements: recent.map((k) => serializeKalla(k, user)),
  };
}

/** חתונות ב־N הימים הקרובים, בלי תאריכים מוסתרים (חוץ ממי שמותר לה לראות) */
export async function upcomingWeddings(user: AuthUser, days: number) {
  const today = todayInZone(env.TIMEZONE);
  const kallot = await prisma.kalla.findMany({
    where: { classGroup: { yearbookId: user.yearbookId }, weddingAt: { gte: today, lte: addDays(today, days) } },
    include: kallaInclude,
    orderBy: { weddingAt: 'asc' },
  });
  return kallot
    .filter((k) => !k.hideWeddingDate || canSeeHiddenWedding(user, k))
    .map((k) => ({ ...serializeKalla(k, user), daysUntil: daysBetween(today, k.weddingAt as Date) }));
}

/** לוח שנה: כל ימי החודש העברי שבו נמצא התאריך, ובכל יום החתונות שלו */
export async function calendar(user: AuthUser, date?: string, classId?: string, specializationId?: string) {
  const anchor = date ? parseDateOnly(date) : todayInZone(env.TIMEZONE);
  const { start, end } = hebrewMonthRange(anchor);
  const kallot = await prisma.kalla.findMany({
    where: {
      classGroup: { yearbookId: user.yearbookId },
      weddingAt: { gte: start, lte: end },
      ...(classId ? { classId } : {}),
      ...(specializationId ? { specializationId } : {}),
    },
    include: kallaInclude,
    orderBy: [{ weddingAt: 'asc' }, { name: 'asc' }],
  });
  const visible = kallot.filter((k) => !k.hideWeddingDate || canSeeHiddenWedding(user, k));

  const days = [];
  for (let d = start; d.getTime() <= end.getTime(); d = addDays(d, 1)) {
    const key = formatDateOnly(d);
    days.push({
      date: key,
      hebrewDate: toHebrewDate(d),
      weekday: d.getUTCDay(), // 0 = ראשון
      weddings: visible
        .filter((k) => k.weddingAt && formatDateOnly(k.weddingAt) === key)
        .map((k) => ({
          kallaId: k.id,
          name: k.name,
          className: k.classGroup.name,
          specializationName: k.specialization.name,
          yeshivaName: k.yeshiva.name,
          hallName: k.hallName,
          hallCity: k.hallCity,
        })),
    });
  }
  return {
    month: hebrewMonthLabel(anchor),
    start: formatDateOnly(start),
    end: formatDateOnly(end),
    prevMonthDate: formatDateOnly(addDays(start, -1)),
    nextMonthDate: formatDateOnly(addDays(end, 1)),
    days,
  };
}
