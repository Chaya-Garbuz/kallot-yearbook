import { z } from 'zod';

export const TOPICS = ['PREPARATIONS', 'HOME', 'FINANCE', 'RECIPES', 'NEWS'] as const;

export const articlesQuery = z.object({
  topic: z.enum(TOPICS).optional(),
  q: z.string().trim().max(60).optional(),
});

export const slugParam = z.object({ slug: z.string().trim().min(1).max(100) });

export const createArticleSchema = z.object({
  title: z.string().trim().min(2, 'כותרת באורך 2 תווים לפחות').max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'כתובת הדף: אותיות באנגלית קטנות, ספרות ומקפים'),
  topic: z.enum(TOPICS),
  body: z.string().trim().min(10, 'תוכן באורך 10 תווים לפחות').max(20000),
  isPublished: z.boolean().optional(),
});

export const updateArticleSchema = createArticleSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'לא נשלח אף שדה לעדכון' });

export const newsletterSchema = z.object({
  topics: z.array(z.enum(TOPICS)).max(TOPICS.length),
  isActive: z.boolean().optional(),
});

export const tokenParam = z.object({ token: z.string().uuid() });
