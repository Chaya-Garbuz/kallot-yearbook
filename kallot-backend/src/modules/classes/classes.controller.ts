import type { Request, Response } from 'express';
import { currentUser } from '../../middleware/auth';
import { valid } from '../../middleware/validate';
import * as service from './classes.service';
import { createClassSchema, idParam, updateClassSchema } from './classes.schemas';

export async function list(req: Request, res: Response) {
  res.json(await service.listClasses(currentUser(req)));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await service.createClass(currentUser(req), valid(req, 'body', createClassSchema)));
}

export async function update(req: Request, res: Response) {
  const { id } = valid(req, 'params', idParam);
  res.json(await service.updateClass(currentUser(req), id, valid(req, 'body', updateClassSchema)));
}

export async function remove(req: Request, res: Response) {
  await service.deleteClass(currentUser(req), valid(req, 'params', idParam).id);
  res.status(204).end();
}
