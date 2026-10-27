import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler as h } from '../../utils/asyncHandler';
import * as c from './reminders.controller';
import { setRemindersSchema } from './reminders.schemas';

export const reminderRoutes = Router();

reminderRoutes.get('/me/reminders', requireAuth, h(c.list));
reminderRoutes.put('/me/reminders', requireAuth, validate('body', setRemindersSchema), h(c.set));
