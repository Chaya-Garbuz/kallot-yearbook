import type { Request, Response } from 'express';
import { currentUser } from '../../middleware/auth';
import { valid } from '../../middleware/validate';
import * as service from './auth.service';
import { forgotSchema, joinCodeQuerySchema, loginSchema, registerSchema, resetSchema, updateMeSchema } from './auth.schemas';

export async function register(req: Request, res: Response) {
  const { token, user } = await service.register(valid(req, 'body', registerSchema));
  res.status(201).json({ message: 'נרשמת בהצלחה! ברוכה הבאה לשנתון', token, user });
}

export async function login(req: Request, res: Response) {
  res.json(await service.login(valid(req, 'body', loginSchema)));
}

export async function me(req: Request, res: Response) {
  res.json(await service.me(currentUser(req)));
}

export async function updateMe(req: Request, res: Response) {
  res.json(await service.updateMe(currentUser(req), valid(req, 'body', updateMeSchema)));
}

export async function forgot(req: Request, res: Response) {
  res.json(await service.forgotPassword(valid(req, 'body', forgotSchema).email));
}

export async function reset(req: Request, res: Response) {
  const body = valid(req, 'body', resetSchema);
  res.json(await service.resetPassword(body.token, body.newPassword));
}

export async function classesForJoinCode(req: Request, res: Response) {
  res.json(await service.classesForJoinCode(valid(req, 'query', joinCodeQuerySchema).joinCode));
}
