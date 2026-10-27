import type { Request, Response } from 'express';
import { currentUser } from '../../middleware/auth';
import { valid } from '../../middleware/validate';
import { idParam } from '../classes/classes.schemas';
import { jobs } from '../../jobs/jobs';
import * as service from './admin.service';
import {
  addRepSchema,
  announcementSchema,
  exportQuery,
  jobParam,
  listUsersQuery,
  repParams,
  updateUserSchema,
} from './admin.schemas';

export async function listUsers(req: Request, res: Response) {
  res.json(await service.listUsers(currentUser(req), valid(req, 'query', listUsersQuery)));
}

export async function updateUser(req: Request, res: Response) {
  res.json(await service.updateUser(currentUser(req), valid(req, 'params', idParam).id, valid(req, 'body', updateUserSchema)));
}

export async function listReps(req: Request, res: Response) {
  res.json(await service.listReps(currentUser(req), valid(req, 'params', idParam).id));
}

export async function addRep(req: Request, res: Response) {
  const { id } = valid(req, 'params', idParam);
  res.status(201).json(await service.addRep(currentUser(req), id, valid(req, 'body', addRepSchema).userId));
}

export async function removeRep(req: Request, res: Response) {
  const p = valid(req, 'params', repParams);
  await service.removeRep(currentUser(req), p.id, p.userId);
  res.status(204).end();
}

export async function sendAnnouncement(req: Request, res: Response) {
  res.status(201).json(await service.sendAnnouncement(currentUser(req), valid(req, 'body', announcementSchema)));
}

export async function listAnnouncements(req: Request, res: Response) {
  res.json(await service.listAnnouncements(currentUser(req)));
}

export async function exportCsv(req: Request, res: Response) {
  const { filename, csv } = await service.exportCsv(currentUser(req), valid(req, 'query', exportQuery).classId);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}

/** הרצה ידנית של משימה מתוזמנת (לבדיקה מתוך Swagger) */
export async function runJob(req: Request, res: Response) {
  const { name } = valid(req, 'params', jobParam);
  res.json({ job: name, result: await jobs[name]() });
}
