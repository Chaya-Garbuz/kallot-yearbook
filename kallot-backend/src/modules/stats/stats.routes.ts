import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler as h } from '../../utils/asyncHandler';
import * as c from './stats.controller';
import { calendarQuery, weddingsQuery } from './stats.schemas';

export const statsRoutes = Router();

statsRoutes.get('/overview', requireAuth, h(c.overview));
statsRoutes.get('/weddings', requireAuth, validate('query', weddingsQuery), h(c.weddings));
statsRoutes.get('/calendar', requireAuth, validate('query', calendarQuery), h(c.calendar));
