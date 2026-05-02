import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const router = Router();

router.post('/dev-login', async (req: Request, res: Response) => {
  const { username, email } = req.body as Record<string, unknown>;

  if (typeof username !== 'string' || username.trim().length === 0) {
    return res.status(400).json({ error: 'username is required' });
  }

  const normalizedUsername = username.trim();
  const normalizedEmail = typeof email === 'string' && email.trim().length > 0
    ? email.trim()
    : `${normalizedUsername}@dev.local`;

  try {
    const user = await prisma.user.upsert({
      where: { username: normalizedUsername },
      update: { email: normalizedEmail },
      create: {
        username: normalizedUsername,
        email: normalizedEmail,
        role: 'user',
      },
    });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET not configured' });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({ token });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to login';
    return res.status(500).json({ error: message });
  }
});

export default router;
