import { z } from 'zod';

export const idParam = z.object({ id: z.string().uuid('מזהה לא תקין') });

export const createClassSchema = z.object({
  name: z.string().trim().min(1, 'חסר שם כיתה').max(20),
  size: z.number().int().min(1, 'מספר בנות בין 1 ל־80').max(80, 'מספר בנות בין 1 ל־80'),
  order: z.number().int().min(0).optional(),
});

export const updateClassSchema = createClassSchema.partial().refine((v) => Object.keys(v).length > 0, {
  message: 'לא נשלח אף שדה לעדכון',
});
