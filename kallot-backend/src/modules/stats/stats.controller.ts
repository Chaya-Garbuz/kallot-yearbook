import type { Request, Response } from 'express';
import { currentUser } from '../../middleware/auth';
import { valid } from '../../middleware/validate';
import * as service from './stats.service';
import { calendarQuery, weddingsQuery } from './stats.schemas';

export async function overview(req: Request, res: Response) {
  res.json(await service.overview(currentUser(req)));
}

export async function weddings(req: Request, res: Response) {
  res.json(await service.upcomingWeddings(currentUser(req), valid(req, 'query', weddingsQuery).days));
}

export async function calendar(req: Request, res: Response) {
  const q = valid(req, 'query', calendarQuery);
  res.json(await service.calendar(currentUser(req), q.date, q.classId, q.specializationId));
}
