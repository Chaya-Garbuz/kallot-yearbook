import { z } from 'zod';

export const listUsersQuery = z.object({
  q: z.string().trim().max(60).optional(),
  classId: z.string().uuid().optional(),
  role: z.enum(['ADMIN', 'REP', 'GRADUATE']).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'BLOCKED']).optional(),
});

export const updateUserSchema = z
  .object({
    status: z.enum(['ACTIVE', 'BLOCKED']).optional(),
    classId: z.string().uuid().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'לא נשלח אף שדה לעדכון' });

export const addRepSchema = z.object({ userId: z.string().uuid('יש לבחור בת מהכיתה') });

export const repParams = z.object({ id: z.string().uuid(), userId: z.string().uuid() });

export const announcementSchema = z.object({
  classId: z.string().uuid().optional(),
  subject: z.string().trim().min(2, 'נושא באורך 2 תווים לפחות').max(80, 'נושא עד 80 תווים'),
  body: z.string().trim().min(2, 'תוכן באורך 2 תווים לפחות').max(2000, 'תוכן עד 2,000 תווים'),
});

export const exportQuery = z.object({ classId: z.string().uuid().optional() });

export const JOB_NAMES = ['remindersBefore', 'remindersDay', 'blessingsDigest', 'weeklyNewsletter', 'adminSummary', 'cleanup'] as const;
export const jobParam = z.object({ name: z.enum(JOB_NAMES) });
