import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler as h } from '../../utils/asyncHandler';
import { idParam } from '../classes/classes.schemas';
import * as c from './albums.controller';
import {
  albumQuery,
  albumsQuery,
  createBlessingSchema,
  hideBlessingSchema,
  kallaIdParam,
  updateBlessingSchema,
} from './albums.schemas';

export const albumRoutes = Router();

albumRoutes.get('/albums', requireAuth, validate('query', albumsQuery), h(c.list));
albumRoutes.get('/albums/:kallaId', requireAuth, validate('params', kallaIdParam), validate('query', albumQuery), h(c.get));
albumRoutes.post('/albums/:kallaId/blessings', requireAuth, validate('params', kallaIdParam), validate('body', createBlessingSchema), h(c.create));
albumRoutes.patch('/blessings/:id', requireAuth, validate('params', idParam), validate('body', updateBlessingSchema), h(c.update));
albumRoutes.delete('/blessings/:id', requireAuth, validate('params', idParam), h(c.remove));
albumRoutes.patch('/blessings/:id/hide', requireAuth, validate('params', idParam), validate('body', hideBlessingSchema), h(c.hide));
