import { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import { expressjwt, type Request as JwtRequest } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import type { User } from '@prisma/client';

export const ROLE_HIERARCHY = ['User', 'Moderator', 'Admin', 'SuperAdmin', 'Owner'] as const;
export type Role = (typeof ROLE_HIERARCHY)[number];

export interface AuthenticatedUser {
  sub: string;
  email?: string;
  role: Role;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string | string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      localUser?: User;
    }
  }
}

const issuer = process.env.AUTH_ISSUER;
const audience = process.env.API_AUDIENCE;

if (!issuer || !audience) {
  throw new Error(
    'AUTH_ISSUER and API_AUDIENCE must be set. See .env.example for the Auth² integration.'
  );
}

const verifyJwt = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    jwksUri: `${issuer}/.well-known/jwks.json`,
    cache: true,
    cacheMaxAge: 10 * 60 * 1000,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
  }),
  audience,
  issuer,
  algorithms: ['RS256'],
});

const attachUser = (request: JwtRequest, _response: Response, next: NextFunction): void => {
  if (request.auth) {
    (request as Request).user = request.auth as AuthenticatedUser;
  }
  next();
};

const handleAuthError: ErrorRequestHandler = (error, _request, response, next) => {
  if (error && (error as { name?: string }).name === 'UnauthorizedError') {
    response.status(401).json({ error: 'Invalid or missing token' });
    return;
  }
  next(error);
};

export const requireAuth: Array<RequestHandler | ErrorRequestHandler> = [
  verifyJwt,
  attachUser,
  handleAuthError,
];

/**
 * Role gate. Use after requireAuth:
 *
 *   router.delete('/reviews/:id', requireAuth, requireRole('admin'), handler);
 */
export const requireRole = (role: Role): RequestHandler => {
  return (request, response, next) => {
    if (!request.user) {
      response.status(401).json({ error: 'Not authenticated' });
      return;
    }
    if (request.user.role !== role) {
      response.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
};


/**
 * Minimum-role gate using the 5-tier auth-squared hierarchy:
 * User < Moderator < Admin < SuperAdmin < Owner
 *
 *   router.delete('/messages/:id', requireAuth, requireRoleAtLeast('Admin'), handler);
 */
export const requireRoleAtLeast = (minRole: Role): RequestHandler => {
  const minIdx = ROLE_HIERARCHY.indexOf(minRole);
  return (request: Request, response: Response, next: NextFunction): void => {
    if (!request.user) {
      response.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const userIdx = ROLE_HIERARCHY.indexOf(request.user.role);
    if (userIdx < 0 || userIdx < minIdx) {
      response.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
};

/**
 * Returns true when the authenticated user's role is at least `minRole` in
 * the 5-tier hierarchy. For use in controllers where policy is "owner OR
 * privileged," which can't be expressed as a single middleware gate.
 */
export const hasRoleAtLeast = (role: Role | undefined, minRole: Role): boolean => {
  if (!role) return false;
  const userIdx = ROLE_HIERARCHY.indexOf(role);
  const minIdx = ROLE_HIERARCHY.indexOf(minRole);
  return userIdx >= 0 && userIdx >= minIdx;
};
