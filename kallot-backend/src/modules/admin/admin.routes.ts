import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler as h } from '../../utils/asyncHandler';
import { idParam } from '../classes/classes.schemas';
import * as c from './admin.controller';
import {
  addRepSchema,
  announcementSchema,
  exportQuery,
  jobParam,
  listUsersQuery,
  repParams,
  updateUserSchema,
} from './admin.schemas';

export const adminRoutes = Router();

adminRoutes.use(requireAuth);

const admin = requireRole('ADMIN');
const manager = requireRole('ADMIN', 'REP');

adminRoutes.get('/users', admin, validate('query', listUsersQuery), h(c.listUsers));
adminRoutes.patch('/users/:id', admin, validate('params', idParam), validate('body', updateUserSchema), h(c.updateUser));

adminRoutes.get('/classes/:id/reps', admin, validate('params', idParam), h(c.listReps));
adminRoutes.post('/classes/:id/reps', admin, validate('params', idParam), validate('body', addRepSchema), h(c.addRep));
adminRoutes.delete('/classes/:id/reps/:userId', admin, validate('params', repParams), h(c.removeRep));

adminRoutes.get('/announcements', manager, h(c.listAnnouncements));
adminRoutes.post('/announcements', manager, validate('body', announcementSchema), h(c.sendAnnouncement));

adminRoutes.get('/export', manager, validate('query', exportQuery), h(c.exportCsv));

adminRoutes.post('/jobs/:name/run', admin, validate('params', jobParam), h(c.runJob));
