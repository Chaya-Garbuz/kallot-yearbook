import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler as h } from '../../utils/asyncHandler';
import { idParam } from '../classes/classes.schemas';
import * as c from './yeshivot.controller';
import {
  createYeshivaSchema,
  mergeYeshivotSchema,
  searchYeshivotQuery,
  updateYeshivaSchema,
  yeshivaStatsQuery,
} from './yeshivot.schemas';

export const yeshivaRoutes = Router();

yeshivaRoutes.use(requireAuth);
yeshivaRoutes.get('/', validate('query', searchYeshivotQuery), h(c.search));
yeshivaRoutes.get('/stats', validate('query', yeshivaStatsQuery), h(c.stats));
yeshivaRoutes.post('/', requireRole('ADMIN', 'REP'), validate('body', createYeshivaSchema), h(c.create));
yeshivaRoutes.post('/merge', requireRole('ADMIN'), validate('body', mergeYeshivotSchema), h(c.merge));
yeshivaRoutes.patch('/:id', requireRole('ADMIN'), validate('params', idParam), validate('body', updateYeshivaSchema), h(c.update));
