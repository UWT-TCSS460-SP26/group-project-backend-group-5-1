import type { Request, Response, NextFunction } from 'express';

process.env.AUTH_ISSUER = process.env.AUTH_ISSUER ?? 'https://test-issuer.local';
process.env.API_AUDIENCE = process.env.API_AUDIENCE ?? 'group-5-api';
process.env.NODE_ENV = 'test';

jest.mock('../src/middleware/requireAuth', () => ({
  requireAuth: [
    (req: Request, _res: Response, next: NextFunction) => {
      const header = req.headers['x-test-user'];
      if (typeof header === 'string') req.user = JSON.parse(header);
      next();
    },
  ],
  requireRole: (role: string) => (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (req.user.role !== role) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  },
  ROLE_HIERARCHY: ['User', 'Moderator', 'Admin', 'SuperAdmin', 'Owner'],
}));

/*
process.env.JWT_SECRET = 'test-secret';
process.env.AUTH_ISSUER = 'https://example.test';
process.env.API_AUDIENCE = 'test-audience';
*/
