import type { Request, Response } from 'express';
import { currentUser } from '../../middleware/auth';
import { valid } from '../../middleware/validate';
import * as service from './reminders.service';
import { setRemindersSchema } from './reminders.schemas';

export async function list(req: Request, res: Response) {
  res.json(await service.myReminders(currentUser(req)));
}

export async function set(req: Request, res: Response) {
  res.json(await service.setReminders(currentUser(req), valid(req, 'body', setRemindersSchema)));
}
