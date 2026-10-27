import { z } from 'zod';

export const setRemindersSchema = z.object({
  items: z
    .array(
      z.object({
        kallaId: z.string().uuid(),
        timing: z.enum(['BEFORE', 'DAY', 'BOTH']),
      }),
    )
    .max(200),
});
