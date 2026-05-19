import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Upserts a local User row keyed by the Auth² subject claim.
 * - Calls GET {AUTH_ISSUER}/v2/oauth/userinfo on the first seen subject (upsert miss).
 * - Subsequent requests find the existing row and skip the network call.
 * - Attaches the local User row to request.localUser for downstream handlers.
 *
 * Only wire this middleware into routes that actually need a local user row
 * (POST, PUT, DELETE on ratings and reviews). Public GETs skip it entirely.
 */
export async function resolveLocalUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const subject: string | undefined = req.user?.sub;

    if (!subject) {
      res.status(401).json({ error: 'Missing subject claim on token.' });
      return;
    }

    // Fast path: local row already exists — no Auth² round trip needed.
    const existing = await prisma.user.findUnique({
      where: { subjectId: subject },
    });

    if (existing) {
      req.localUser = existing;
      return next();
    }

    // Slow path: first time we've seen this subject — fetch enriched profile.
    const authHeader = req.headers.authorization;
    const userinfoUrl = `${process.env.AUTH_ISSUER}/v2/oauth/userinfo`;

    const userinfoRes = await fetch(userinfoUrl, {
      headers: { Authorization: authHeader ?? '' },
    });

    if (!userinfoRes.ok) {
      res.status(502).json({ error: 'Failed to fetch user info from Auth².' });
      return;
    }

    const info = (await userinfoRes.json()) as Record<string, unknown>;

    const user = await prisma.user.upsert({
      where: { subjectId: subject },
      update: {}, // already exists — nothing to update on a race condition
      create: {
        subjectId: subject,
        username:
          (info.name as string | undefined) ?? (info.email as string | undefined) ?? subject,
        email: (info.email as string | undefined) ?? `${subject}@unknown.invalid`,
        firstName: (info.given_name as string | undefined) ?? null,
        lastName: (info.family_name as string | undefined) ?? null,
        role: req.user?.role ?? 'User',
      },
    });

    req.localUser = user;
    next();
  } catch (err) {
    next(err);
  }
}
