import type { Request, Response } from 'express';
import { currentUser } from '../../middleware/auth';
import { valid } from '../../middleware/validate';
import { idParam } from '../classes/classes.schemas';
import * as service from './yeshivot.service';
import {
  createYeshivaSchema,
  mergeYeshivotSchema,
  searchYeshivotQuery,
  updateYeshivaSchema,
  yeshivaStatsQuery,
} from './yeshivot.schemas';

export async function search(req: Request, res: Response) {
  const q = valid(req, 'query', searchYeshivotQuery);
  res.json(await service.searchYeshivot(currentUser(req), q.q, q.includePending === 'true'));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await service.createYeshiva(currentUser(req), valid(req, 'body', createYeshivaSchema)));
}

export async function update(req: Request, res: Response) {
  res.json(await service.updateYeshiva(valid(req, 'params', idParam).id, valid(req, 'body', updateYeshivaSchema)));
}

export async function merge(req: Request, res: Response) {
  res.json(await service.mergeYeshivot(valid(req, 'body', mergeYeshivotSchema)));
}

export async function stats(req: Request, res: Response) {
  const q = valid(req, 'query', yeshivaStatsQuery);
  res.json(await service.stats(currentUser(req), q.classId, q.specializationId));
}
