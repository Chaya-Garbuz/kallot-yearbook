import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler as h } from '../../utils/asyncHandler';
import * as c from './classes.controller';
import { createClassSchema, idParam, updateClassSchema } from './classes.schemas';

export const classRoutes = Router();

classRoutes.use(requireAuth);
classRoutes.get('/', h(c.list));
classRoutes.post('/', requireRole('ADMIN'), validate('body', createClassSchema), h(c.create));
classRoutes.patch('/:id', requireRole('ADMIN', 'REP'), validate('params', idParam), validate('body', updateClassSchema), h(c.update));
classRoutes.delete('/:id', requireRole('ADMIN'), validate('params', idParam), h(c.remove));
