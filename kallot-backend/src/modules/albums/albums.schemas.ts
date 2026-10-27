import { z } from 'zod';

export const BLESSING_COLORS = ['gold', 'rose', 'sky', 'mint', 'lilac'] as const;

export const albumsQuery = z.object({
  q: z.string().trim().max(40).optional(),
  classId: z.string().uuid().optional(),
});

export const kallaIdParam = z.object({ kallaId: z.string().uuid() });

export const createBlessingSchema = z.object({
  text: z.string().trim().min(2, 'ברכה באורך 2 תווים לפחות').max(500, 'ברכה עד 500 תווים'),
  color: z.enum(BLESSING_COLORS).optional(),
});

export const updateBlessingSchema = createBlessingSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'לא נשלח אף שדה לעדכון' });

export const hideBlessingSchema = z.object({ hidden: z.boolean() });

export const albumQuery = z.object({ includeHidden: z.enum(['true', 'false']).optional() });
