import { env } from '../config/env';
import { prisma } from '../db/prisma';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  template: string;
}

/**
 * שליחת מייל. אם מוגדר RESEND_API_KEY (יש מסלול חינמי ב־Resend), המייל נשלח באמת.
 * אחרת המייל רק נרשם בטבלת EmailLog ובלוג של השרת, כך שהשרת עובד גם בלי שירות מיילים.
 */
export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  const body = `בס״ד\n\n${msg.text}\n\n—\nשנתון הכלות · ${env.FRONTEND_URL}\nלשינוי הגדרות המיילים: ${env.FRONTEND_URL}/settings`;
  if (!env.RESEND_API_KEY) {
    if (env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.log(`[email:${msg.template}] → ${msg.to} | ${msg.subject}`);
    }
    await log(msg, 'LOGGED');
    return true;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [msg.to], subject: msg.subject, text: body }),
    });
    if (!res.ok) {
      await log(msg, 'FAILED', `${res.status} ${await res.text()}`.slice(0, 500));
      return false;
    }
    await log(msg, 'SENT');
    return true;
  } catch (err) {
    await log(msg, 'FAILED', String(err).slice(0, 500));
    return false;
  }
}

async function log(msg: EmailMessage, status: 'SENT' | 'LOGGED' | 'FAILED', error?: string) {
  await prisma.emailLog.create({
    data: { to: msg.to, template: msg.template, subject: msg.subject.slice(0, 200), status, error },
  });
}
