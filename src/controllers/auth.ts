import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export async function devLogin(req: Request, res: Response): Promise<void> {
  const { username, email } = req.body as { username?: string; email?: string };

  if (!username || typeof username !== 'string' || username.trim() === '') {
    res.status(400).json({ error: 'username is required' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'JWT_SECRET not configured' });
    return;
  }

  const user = await prisma.user.upsert({
    where: { username: username.trim() },
    update: {},
    create: {
      subjectId: `dev:${username.trim()}`,
      username: username.trim(),
      email: email?.trim() ?? `${username.trim()}@dev.local`,
    },
  });

  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, secret, {
    expiresIn: '7d',
  });

  res.status(200).json({ token });
}
