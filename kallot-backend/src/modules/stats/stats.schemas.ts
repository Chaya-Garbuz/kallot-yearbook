import { z } from 'zod';
import { dateOnly } from '../kallot/kallot.schemas';

export const weddingsQuery = z.object({
  days: z.coerce.number().int().min(1).max(365).default(60),
});

export const calendarQuery = z.object({
  date: dateOnly.optional(),
  classId: z.string().uuid().optional(),
  specializationId: z.string().uuid().optional(),
});
