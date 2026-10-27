import type { Request, Response } from 'express';
import { currentUser } from '../../middleware/auth';
import { valid } from '../../middleware/validate';
import { idParam } from '../classes/classes.schemas';
import * as service from './kallot.service';
import { classIdParam, createKallaSchema, listKallotQuery, updateKallaSchema, weddingSchema } from './kallot.schemas';

export async function list(req: Request, res: Response) {
  res.json(await service.listKallot(currentUser(req), valid(req, 'query', listKallotQuery)));
}

export async function get(req: Request, res: Response) {
  res.json(await service.getKalla(currentUser(req), valid(req, 'params', idParam).id));
}

export async function listByClass(req: Request, res: Response) {
  res.json(await service.listByClass(currentUser(req), valid(req, 'params', classIdParam).classId));
}

export async function create(req: Request, res: Response) {
  const { classId } = valid(req, 'params', classIdParam);
  res.status(201).json(await service.createKalla(currentUser(req), classId, valid(req, 'body', createKallaSchema)));
}

export async function update(req: Request, res: Response) {
  res.json(await service.updateKalla(currentUser(req), valid(req, 'params', idParam).id, valid(req, 'body', updateKallaSchema)));
}

export async function updateWedding(req: Request, res: Response) {
  res.json(await service.updateWedding(currentUser(req), valid(req, 'params', idParam).id, valid(req, 'body', weddingSchema)));
}

export async function remove(req: Request, res: Response) {
  await service.deleteKalla(currentUser(req), valid(req, 'params', idParam).id);
  res.status(204).end();
}
