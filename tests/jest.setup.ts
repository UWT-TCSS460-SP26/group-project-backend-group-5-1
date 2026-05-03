process.env.AUTH_ISSUER = process.env.AUTH_ISSUER ?? 'https://test-issuer.local';
process.env.API_AUDIENCE = process.env.API_AUDIENCE ?? 'group-5-api';
process.env.NODE_ENV = 'test';

jest.mock('../src/middleware/requireAuth', () => ({
  requireAuth: [
    (req: any, _res: any, next: any) => {
      const header = req.headers['x-test-user'];
      if (header) req.user = JSON.parse(header);
      next();
    },
  ],
  requireRole: (role: string) => (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (req.user.role !== role) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  },
  ROLE_HIERARCHY: ['User', 'Moderator', 'Admin', 'SuperAdmin', 'Owner'],
}));