import { z } from 'zod';

export const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'תאריך בפורמט YYYY-MM-DD')
  .refine((s) => !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime()), 'תאריך לא תקין');

const hallName = z.string().trim().min(2, 'שם אולם באורך 2 תווים לפחות').max(60);
const hallCity = z.string().trim().min(2, 'עיר באורך 2 תווים לפחות').max(30);

export const createKallaSchema = z.object({
  name: z.string().trim().min(2, 'שם כלה באורך 2 תווים לפחות').max(40),
  specializationId: z.string().uuid('יש לבחור התמחות'),
  yeshivaId: z.string().uuid('יש לבחור ישיבה'),
  engagedAt: dateOnly,
  weddingAt: dateOnly.nullable().optional(),
  hallName: hallName.nullable().optional(),
  hallCity: hallCity.nullable().optional(),
  hideWeddingDate: z.boolean().optional(),
  userId: z.string().uuid().nullable().optional(),
});

export const updateKallaSchema = createKallaSchema
  .partial()
  .extend({ classId: z.string().uuid().optional() })
  .refine((v) => Object.keys(v).length > 0, { message: 'לא נשלח אף שדה לעדכון' });

export const weddingSchema = z
  .object({
    weddingAt: dateOnly.nullable().optional(),
    hallName: hallName.nullable().optional(),
    hallCity: hallCity.nullable().optional(),
    hideWeddingDate: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'לא נשלח אף שדה לעדכון' });

export const listKallotQuery = z.object({
  q: z.string().trim().max(40).optional(),
  classId: z.string().uuid().optional(),
  specializationId: z.string().uuid().optional(),
  yeshivaId: z.string().uuid().optional(),
  hasWedding: z.enum(['true', 'false']).optional(),
  sort: z.enum(['name', 'engagedAt', 'weddingAt', 'className']).default('engagedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

export const classIdParam = z.object({ classId: z.string().uuid('מזהה כיתה לא תקין') });
