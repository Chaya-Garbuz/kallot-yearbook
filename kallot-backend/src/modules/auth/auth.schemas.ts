import { z } from 'zod';

const password = z
  .string()
  .min(8, 'סיסמה באורך 8 תווים לפחות')
  .max(72)
  .regex(/[A-Za-zא-ת]/, 'הסיסמה צריכה לכלול לפחות אות אחת')
  .regex(/\d/, 'הסיסמה צריכה לכלול לפחות ספרה אחת');

export const registerSchema = z.object({
  joinCode: z.string().trim().min(1, 'חסר קוד מחזור').max(30),
  classId: z.string().uuid('יש לבחור כיתה'),
  name: z.string().trim().min(2, 'שם באורך 2 תווים לפחות').max(30),
  email: z.string().trim().toLowerCase().email('מייל לא תקין').max(120),
  password,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('מייל לא תקין'),
  password: z.string().min(1, 'חסרה סיסמה'),
});

export const updateMeSchema = z
  .object({
    name: z.string().trim().min(2).max(30).optional(),
    currentPassword: z.string().optional(),
    newPassword: password.optional(),
    blessingEmailPref: z.enum(['EACH', 'DAILY', 'NONE']).optional(),
    reminderEmails: z.boolean().optional(),
    announcementEmails: z.boolean().optional(),
  })
  .refine((v) => !v.newPassword || !!v.currentPassword, {
    message: 'כדי להחליף סיסמה צריך להזין את הסיסמה הנוכחית',
    path: ['currentPassword'],
  });

export const forgotSchema = z.object({ email: z.string().trim().toLowerCase().email() });
export const resetSchema = z.object({ token: z.string().min(10), newPassword: password });

export const joinCodeQuerySchema = z.object({ joinCode: z.string().trim().min(1, 'חסר קוד מחזור').max(30) });
