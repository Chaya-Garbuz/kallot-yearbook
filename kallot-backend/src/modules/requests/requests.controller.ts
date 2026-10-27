import type { Request, Response } from 'express';
import { currentUser } from '../../middleware/auth';
import { valid } from '../../middleware/validate';
import { idParam } from '../classes/classes.schemas';
import * as service from './requests.service';
import { reportSchema, reviewSchema, userIdParam } from './requests.schemas';

export async function createReport(req: Request, res: Response) {
  res.status(201).json(await service.createReport(currentUser(req), valid(req, 'body', reportSchema)));
}

export async function myReports(req: Request, res: Response) {
  res.json(await service.myReports(currentUser(req)));
}

export async function pending(req: Request, res: Response) {
  res.json(await service.pendingForReview(currentUser(req)));
}

export async function reviewReport(req: Request, res: Response) {
  res.json(await service.reviewReport(currentUser(req), valid(req, 'params', idParam).id, valid(req, 'body', reviewSchema)));
}

export async function reviewRegistration(req: Request, res: Response) {
  const { userId } = valid(req, 'params', userIdParam);
  res.json(await service.reviewRegistration(currentUser(req), userId, valid(req, 'body', reviewSchema).action));
}
