import { z } from 'zod';
import { createKallaSchema } from '../kallot/kallot.schemas';

const reportData = createKallaSchema.omit({ userId: true });

export const reportSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('NEW'), data: reportData }),
  z.object({
    type: z.literal('UPDATE'),
    data: reportData.partial().refine((v) => Object.keys(v).length > 0, { message: 'לא נשלח אף שדה לעדכון' }),
  }),
]);

export const reviewSchema = z.object({
  action: z.enum(['approve', 'decline']),
  note: z.string().trim().max(200).optional(),
});

export const userIdParam = z.object({ userId: z.string().uuid() });
