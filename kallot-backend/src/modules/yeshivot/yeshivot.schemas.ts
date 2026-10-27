import { z } from 'zod';

export const searchYeshivotQuery = z.object({
  q: z.string().trim().max(60).optional(),
  includePending: z.enum(['true', 'false']).optional(),
});

export const createYeshivaSchema = z.object({
  name: z.string().trim().min(2, 'שם ישיבה באורך 2 תווים לפחות').max(60),
  aliases: z.array(z.string().trim().min(2).max(60)).max(10).optional(),
});

export const updateYeshivaSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    aliases: z.array(z.string().trim().min(2).max(60)).max(10).optional(),
    isApproved: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'לא נשלח אף שדה לעדכון' });

export const mergeYeshivotSchema = z.object({
  targetId: z.string().uuid(),
  sourceIds: z.array(z.string().uuid()).min(1, 'צריך לבחור לפחות ישיבה אחת לאיחוד').max(20),
});

export const yeshivaStatsQuery = z.object({
  classId: z.string().uuid().optional(),
  specializationId: z.string().uuid().optional(),
});
