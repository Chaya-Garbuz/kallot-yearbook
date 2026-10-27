import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { rateLimit } from '../../middleware/rateLimit';
import { asyncHandler as h } from '../../utils/asyncHandler';
import { idParam } from '../classes/classes.schemas';
import * as c from './content.controller';
import {
  articlesQuery,
  createArticleSchema,
  newsletterSchema,
  slugParam,
  tokenParam,
  updateArticleSchema,
} from './content.schemas';

export const contentRoutes = Router();

contentRoutes.get('/articles', requireAuth, validate('query', articlesQuery), h(c.list));
contentRoutes.get('/articles/:slug', requireAuth, validate('params', slugParam), h(c.get));
contentRoutes.post('/articles', requireAuth, requireRole('ADMIN'), validate('body', createArticleSchema), h(c.create));
contentRoutes.patch('/articles/:id', requireAuth, requireRole('ADMIN'), validate('params', idParam), validate('body', updateArticleSchema), h(c.update));
contentRoutes.delete('/articles/:id', requireAuth, requireRole('ADMIN'), validate('params', idParam), h(c.remove));

contentRoutes.get('/me/newsletter', requireAuth, h(c.getNewsletter));
contentRoutes.put('/me/newsletter', requireAuth, validate('body', newsletterSchema), h(c.setNewsletter));
contentRoutes.get('/unsubscribe/:token', rateLimit(20), validate('params', tokenParam), h(c.unsubscribe));
