import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler as h } from '../../utils/asyncHandler';
import { idParam } from '../classes/classes.schemas';
import * as c from './kallot.controller';
import { classIdParam, createKallaSchema, listKallotQuery, updateKallaSchema, weddingSchema } from './kallot.schemas';

// נתיבים שמתחילים ב־/api (גם /classes/:classId/kallot וגם /kallot)
export const kallotRoutes = Router();

kallotRoutes.use('/kallot', requireAuth);
kallotRoutes.use('/classes/:classId/kallot', requireAuth);

kallotRoutes.get('/kallot', validate('query', listKallotQuery), h(c.list));
kallotRoutes.get('/kallot/:id', validate('params', idParam), h(c.get));
kallotRoutes.patch('/kallot/:id', requireRole('ADMIN', 'REP'), validate('params', idParam), validate('body', updateKallaSchema), h(c.update));
kallotRoutes.patch('/kallot/:id/wedding', validate('params', idParam), validate('body', weddingSchema), h(c.updateWedding));
kallotRoutes.delete('/kallot/:id', requireRole('ADMIN', 'REP'), validate('params', idParam), h(c.remove));

kallotRoutes.get('/classes/:classId/kallot', validate('params', classIdParam), h(c.listByClass));
kallotRoutes.post(
  '/classes/:classId/kallot',
  requireRole('ADMIN', 'REP'),
  validate('params', classIdParam),
  validate('body', createKallaSchema),
  h(c.create),
);
