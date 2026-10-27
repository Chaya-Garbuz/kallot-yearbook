import type { Request, Response } from 'express';
import { currentUser } from '../../middleware/auth';
import { valid } from '../../middleware/validate';
import { idParam } from '../classes/classes.schemas';
import * as service from './content.service';
import {
  articlesQuery,
  createArticleSchema,
  newsletterSchema,
  slugParam,
  tokenParam,
  updateArticleSchema,
} from './content.schemas';

export async function list(req: Request, res: Response) {
  const q = valid(req, 'query', articlesQuery);
  res.json(await service.listArticles(currentUser(req), q.topic, q.q));
}

export async function get(req: Request, res: Response) {
  res.json(await service.getArticle(currentUser(req), valid(req, 'params', slugParam).slug));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await service.createArticle(currentUser(req), valid(req, 'body', createArticleSchema)));
}

export async function update(req: Request, res: Response) {
  res.json(await service.updateArticle(valid(req, 'params', idParam).id, valid(req, 'body', updateArticleSchema)));
}

export async function remove(req: Request, res: Response) {
  await service.deleteArticle(valid(req, 'params', idParam).id);
  res.status(204).end();
}

export async function getNewsletter(req: Request, res: Response) {
  res.json(await service.getNewsletter(currentUser(req)));
}

export async function setNewsletter(req: Request, res: Response) {
  res.json(await service.setNewsletter(currentUser(req), valid(req, 'body', newsletterSchema)));
}

export async function unsubscribe(req: Request, res: Response) {
  res.json(await service.unsubscribe(valid(req, 'params', tokenParam).token));
}
