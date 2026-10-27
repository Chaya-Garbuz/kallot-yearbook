import type { Request, Response } from 'express';
import { currentUser } from '../../middleware/auth';
import { valid } from '../../middleware/validate';
import { idParam } from '../classes/classes.schemas';
import * as service from './albums.service';
import {
  albumQuery,
  albumsQuery,
  createBlessingSchema,
  hideBlessingSchema,
  kallaIdParam,
  updateBlessingSchema,
} from './albums.schemas';

export async function list(req: Request, res: Response) {
  const q = valid(req, 'query', albumsQuery);
  res.json(await service.listAlbums(currentUser(req), q.q, q.classId));
}

export async function get(req: Request, res: Response) {
  const { kallaId } = valid(req, 'params', kallaIdParam);
  res.json(await service.getAlbum(currentUser(req), kallaId, valid(req, 'query', albumQuery).includeHidden === 'true'));
}

export async function create(req: Request, res: Response) {
  const { kallaId } = valid(req, 'params', kallaIdParam);
  res.status(201).json(await service.createBlessing(currentUser(req), kallaId, valid(req, 'body', createBlessingSchema)));
}

export async function update(req: Request, res: Response) {
  res.json(await service.updateBlessing(currentUser(req), valid(req, 'params', idParam).id, valid(req, 'body', updateBlessingSchema)));
}

export async function remove(req: Request, res: Response) {
  await service.deleteBlessing(currentUser(req), valid(req, 'params', idParam).id);
  res.status(204).end();
}

export async function hide(req: Request, res: Response) {
  res.json(await service.setHidden(currentUser(req), valid(req, 'params', idParam).id, valid(req, 'body', hideBlessingSchema).hidden));
}
