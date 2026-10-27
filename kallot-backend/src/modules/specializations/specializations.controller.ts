import type { Request, Response } from 'express';
import { currentUser } from '../../middleware/auth';
import { valid } from '../../middleware/validate';
import { idParam } from '../classes/classes.schemas';
import * as service from './specializations.service';
import { createSpecializationSchema, specializationStatsQuery, updateSpecializationSchema } from './specializations.schemas';

export async function list(req: Request, res: Response) {
  res.json(await service.listSpecializations(currentUser(req)));
}

export async function stats(req: Request, res: Response) {
  res.json(await service.specializationStats(currentUser(req), valid(req, 'query', specializationStatsQuery).classId));
}

export async function kallot(req: Request, res: Response) {
  res.json(await service.kallotInSpecialization(currentUser(req), valid(req, 'params', idParam).id));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await service.createSpecialization(currentUser(req), valid(req, 'body', createSpecializationSchema)));
}

export async function update(req: Request, res: Response) {
  const { id } = valid(req, 'params', idParam);
  res.json(await service.updateSpecialization(currentUser(req), id, valid(req, 'body', updateSpecializationSchema)));
}

export async function remove(req: Request, res: Response) {
  await service.deleteSpecialization(currentUser(req), valid(req, 'params', idParam).id);
  res.status(204).end();
}
