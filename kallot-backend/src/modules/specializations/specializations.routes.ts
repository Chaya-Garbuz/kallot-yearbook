import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler as h } from '../../utils/asyncHandler';
import { idParam } from '../classes/classes.schemas';
import * as c from './specializations.controller';
import { createSpecializationSchema, specializationStatsQuery, updateSpecializationSchema } from './specializations.schemas';

export const specializationRoutes = Router();

specializationRoutes.use(requireAuth);
specializationRoutes.get('/', h(c.list));
specializationRoutes.get('/stats', validate('query', specializationStatsQuery), h(c.stats));
specializationRoutes.get('/:id/kallot', validate('params', idParam), h(c.kallot));
specializationRoutes.post('/', requireRole('ADMIN'), validate('body', createSpecializationSchema), h(c.create));
specializationRoutes.patch('/:id', requireRole('ADMIN'), validate('params', idParam), validate('body', updateSpecializationSchema), h(c.update));
specializationRoutes.delete('/:id', requireRole('ADMIN'), validate('params', idParam), h(c.remove));
