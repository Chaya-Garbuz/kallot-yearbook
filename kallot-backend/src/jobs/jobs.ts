import { env } from '../config/env';
import { prisma } from '../db/prisma';
import { addDays, toHebrewDate, todayInZone } from '../utils/dates';
import { sendEmail } from '../services/email';

// כל משימה מחזירה כמה מיילים נשלחו. אפשר להריץ אותה שוב בלי כפילויות.

type JobResult = { sent: number };

function reminderText(k: { name: string; weddingAt: Date | null; hallName: string | null; hallCity: string | null; classGroup: { name: string }; yeshiva: { name: string } }) {
  const hall = k.hallName ? `\nאולם: ${k.hallName}${k.hallCity ? `, ${k.hallCity}` : ''}` : '';
  return `החתונה של ${k.name} מכיתה ${k.classGroup.name} תתקיים בעז״ה ב־${k.weddingAt ? toHebrewDate(k.weddingAt) : ''}.${hall}\nהחתן לומד בישיבת ${k.yeshiva.name}.`;
}

async function sendReminders(which: 'before' | 'day', now: Date): Promise<JobResult> {
  const today = todayInZone(env.TIMEZONE, now);
  const target = which === 'before' ? addDays(today, 1) : today;
  const subs = await prisma.reminderSubscription.findMany({
    where: {
      timing: { in: which === 'before' ? ['BEFORE', 'BOTH'] : ['DAY', 'BOTH'] },
      ...(which === 'before' ? { sentBeforeAt: null } : { sentDayAt: null }),
      kalla: { weddingAt: target, hideWeddingDate: false },
      user: { status: 'ACTIVE', reminderEmails: true },
    },
    include: { user: true, kalla: { include: { classGroup: true, yeshiva: true } } },
  });
  let sent = 0;
  for (const s of subs) {
    // סימון לפני שליחה, כדי שריצה כפולה לא תשלח פעמיים
    const claimed = await prisma.reminderSubscription.updateMany({
      where: { id: s.id, ...(which === 'before' ? { sentBeforeAt: null } : { sentDayAt: null }) },
      data: which === 'before' ? { sentBeforeAt: now } : { sentDayAt: now },
    });
    if (claimed.count === 0) continue;
    await sendEmail({
      to: s.user.email,
      template: which === 'before' ? 'reminder-before' : 'reminder-day',
      subject: which === 'before' ? `מחר בעז״ה החתונה של ${s.kalla.name}` : `היום בעז״ה החתונה של ${s.kalla.name}`,
      text: `מזל טוב!\n\n${reminderText(s.kalla)}`,
    });
    sent += 1;
  }
  return { sent };
}

export const remindersBefore = (now = new Date()) => sendReminders('before', now);
export const remindersDay = (now = new Date()) => sendReminders('day', now);

/** מייל אחד ביום לכל כלה שבחרה ״פעם ביום״, עם הברכות החדשות */
export async function blessingsDigest(now = new Date()): Promise<JobResult> {
  const blessings = await prisma.blessing.findMany({
    where: { emailedAt: null, isHidden: false, kalla: { user: { isNot: null } } },
    include: { author: { select: { name: true } }, kalla: { include: { user: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const byKalla = new Map<string, typeof blessings>();
  for (const b of blessings) byKalla.set(b.kallaId, [...(byKalla.get(b.kallaId) ?? []), b]);

  let sent = 0;
  for (const [kallaId, list] of byKalla) {
    const user = list[0]?.kalla.user;
    if (!user) continue;
    const ids = list.map((b) => b.id);
    if (user.status === 'ACTIVE' && user.blessingEmailPref === 'DAILY') {
      const lines = list.map((b) => `• ${b.author.name}: ${b.text}`).join('\n\n');
      await sendEmail({
        to: user.email,
        template: 'blessings-digest',
        subject: `קיבלת ${list.length} ברכות חדשות באלבום`,
        text: `${lines}\n\nלאלבום: ${env.FRONTEND_URL}/albums/${kallaId}`,
      });
      sent += 1;
    }
    // גם כשהכלה בחרה ״בלי מיילים״ מסמנים, כדי שאם תשנה את הבחירה לא יישלחו ברכות ישנות
    await prisma.blessing.updateMany({ where: { id: { in: ids } }, data: { emailedAt: now } });
  }
  return { sent };
}

const TOPIC_LABEL: Record<string, string> = {
  PREPARATIONS: 'הכנות לחתונה',
  HOME: 'הקמת בית',
  FINANCE: 'ניהול כספים',
  RECIPES: 'מתכונים',
  NEWS: 'עדכוני שמחות',
};

/** דיוור שבועי: דפי מידע חדשים בנושאים שנבחרו, ועדכוני שמחות */
export async function weeklyNewsletter(now = new Date()): Promise<JobResult> {
  const subs = await prisma.newsletterSubscription.findMany({
    where: { isActive: true, user: { status: 'ACTIVE' } },
    include: { user: true },
  });
  let sent = 0;
  for (const s of subs) {
    if (!s.topics.length) continue;
    const since = s.lastSentAt ?? addDays(now, -7);
    const articles = await prisma.article.findMany({
      where: { isPublished: true, publishedAt: { gt: since }, topic: { in: s.topics } },
      orderBy: { publishedAt: 'desc' },
    });
    const parts: string[] = articles.map((a) => `• ${a.title} (${TOPIC_LABEL[a.topic]})\n  ${env.FRONTEND_URL}/info/${a.slug}`);
    if (s.topics.includes('NEWS')) {
      const newKallot = await prisma.kalla.count({
        where: { createdAt: { gt: since }, classGroup: { yearbookId: s.user.yearbookId } },
      });
      if (newKallot > 0) parts.push(`• השבוע נוספו לשנתון ${newKallot} כלות חדשות. מזל טוב!`);
    }
    if (!parts.length) continue;
    await sendEmail({
      to: s.user.email,
      template: 'weekly-newsletter',
      subject: 'הדיוור השבועי של שנתון הכלות',
      text: `${parts.join('\n\n')}\n\nלהפסקת הדיוור: ${env.PUBLIC_URL}/api/unsubscribe/${s.unsubscribeToken}`,
    });
    await prisma.newsletterSubscription.update({ where: { id: s.id }, data: { lastSentAt: now } });
    sent += 1;
  }
  return { sent };
}

/** סיכום שבועי למנהלות */
export async function adminSummary(now = new Date()): Promise<JobResult> {
  const today = todayInZone(env.TIMEZONE, now);
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN', status: 'ACTIVE' } });
  let sent = 0;
  for (const a of admins) {
    const [newKallot, pendingReports, pendingUsers, weddings] = await Promise.all([
      prisma.kalla.count({ where: { createdAt: { gt: addDays(now, -7) }, classGroup: { yearbookId: a.yearbookId } } }),
      prisma.updateRequest.count({ where: { status: 'PENDING', classGroup: { yearbookId: a.yearbookId } } }),
      prisma.user.count({ where: { status: 'PENDING', yearbookId: a.yearbookId } }),
      prisma.kalla.findMany({
        where: { weddingAt: { gte: today, lte: addDays(today, 7) }, classGroup: { yearbookId: a.yearbookId } },
        include: { classGroup: true },
        orderBy: { weddingAt: 'asc' },
      }),
    ]);
    const list = weddings.map((k) => `• ${k.name} (${k.classGroup.name}) · ${toHebrewDate(k.weddingAt as Date)}`).join('\n');
    await sendEmail({
      to: a.email,
      template: 'admin-summary',
      subject: 'סיכום שבועי: שנתון הכלות',
      text: `השבוע נוספו ${newKallot} כלות.\nדיווחים שמחכים לאישור: ${pendingReports}\nהרשמות שמחכות לאישור: ${pendingUsers}\n\nחתונות בשבוע הקרוב:\n${list || 'אין'}`,
    });
    sent += 1;
  }
  return { sent };
}

/** ניקוי: מינויים לחתונות שעברו לפני יותר מ־30 יום, ותיעוד מיילים בן יותר מ־90 יום */
export async function cleanup(now = new Date()): Promise<JobResult & { removedReminders: number; removedLogs: number }> {
  const today = todayInZone(env.TIMEZONE, now);
  const r = await prisma.reminderSubscription.deleteMany({ where: { kalla: { weddingAt: { lt: addDays(today, -30) } } } });
  const l = await prisma.emailLog.deleteMany({ where: { sentAt: { lt: addDays(now, -90) } } });
  return { sent: 0, removedReminders: r.count, removedLogs: l.count };
}

export const jobs = { remindersBefore, remindersDay, blessingsDigest, weeklyNewsletter, adminSummary, cleanup };
export type JobName = keyof typeof jobs;
