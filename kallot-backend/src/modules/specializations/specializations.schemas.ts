import { z } from 'zod';

export const createSpecializationSchema = z.object({
  name: z.string().trim().min(2, 'שם התמחות באורך 2 תווים לפחות').max(40),
  size: z.number().int().min(1, 'מספר בנות בין 1 ל־300').max(300, 'מספר בנות בין 1 ל־300'),
  order: z.number().int().min(0).optional(),
});

export const updateSpecializationSchema = createSpecializationSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'לא נשלח אף שדה לעדכון' });

export const specializationStatsQuery = z.object({
  classId: z.string().uuid().optional(),
});
