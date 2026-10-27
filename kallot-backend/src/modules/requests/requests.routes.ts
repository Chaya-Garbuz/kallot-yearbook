import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler as h } from '../../utils/asyncHandler';
import { idParam } from '../classes/classes.schemas';
import * as c from './requests.controller';
import { reportSchema, reviewSchema, userIdParam } from './requests.schemas';

export const requestRoutes = Router();

requestRoutes.post('/me/report', requireAuth, validate('body', reportSchema), h(c.createReport));
requestRoutes.get('/me/report', requireAuth, h(c.myReports));

requestRoutes.get('/admin/requests', requireAuth, requireRole('ADMIN', 'REP'), h(c.pending));
requestRoutes.patch(
  '/admin/requests/:id',
  requireAuth,
  requireRole('ADMIN', 'REP'),
  validate('params', idParam),
  validate('body', reviewSchema),
  h(c.reviewReport),
);
requestRoutes.patch(
  '/admin/registrations/:userId',
  requireAuth,
  requireRole('ADMIN', 'REP'),
  validate('params', userIdParam),
  validate('body', reviewSchema),
  h(c.reviewRegistration),
);
