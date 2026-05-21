import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { authHeader } from '../helpers';

jest.mock('../../src/middleware/resolveLocalUser', () => ({
  resolveLocalUser: jest.fn(
    (
      req: import('express').Request,
      _res: import('express').Response,
      next: import('express').NextFunction
    ) => {
      if (req.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).localUser = { id: Number(req.user.sub), role: req.user.role };
      }
      next();
    }
  ),
}));

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    issue: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockIssue = prisma.issue as jest.Mocked<typeof prisma.issue>;

const asAdmin = authHeader({ sub: 1, role: 'Admin' });
const asUser = authHeader({ sub: 2, role: 'User' });

beforeEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// POST /v1/issues — public
// ---------------------------------------------------------------------------

describe('POST /v1/issues', () => {
  const fakeRow = { id: 1, status: 'Open', createdAt: new Date('2026-05-01T00:00:00Z') };

  it('creates an issue with title and description', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([fakeRow]);
    const res = await request(app)
      .post('/v1/issues')
      .send({ title: 'Bug title', description: 'Something broke' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      issueId: 1,
      status: 'Open',
      message: 'Bug report submitted successfully',
    });
    expect(res.body.createdAt).toBeDefined();
  });

  it('rejects a body with only a title and no description', async () => {
    const res = await request(app).post('/v1/issues').send({ title: 'Just a title' });
    expect(res.status).toBe(400);
    expect(res.body.details).toContain('description is required');
  });

  it('rejects a body with only a description and no title', async () => {
    const res = await request(app).post('/v1/issues').send({ description: 'Just a description' });
    expect(res.status).toBe(400);
    expect(res.body.details).toContain('title is required');
  });

  it('rejects a body with neither title nor description', async () => {
    const res = await request(app).post('/v1/issues').send({ reporter: 'someone' });
    expect(res.status).toBe(400);
    expect(res.body.details).toContain('title is required');
    expect(res.body.details).toContain('description is required');
  });

  it('rejects an empty body', async () => {
    const res = await request(app).post('/v1/issues').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid bug report');
  });

  it('rejects a non-string title', async () => {
    const res = await request(app).post('/v1/issues').send({ title: 123 });
    expect(res.status).toBe(400);
    expect(res.body.details).toContain('title must be a string');
  });

  it('rejects a non-string description', async () => {
    const res = await request(app).post('/v1/issues').send({ description: 456 });
    expect(res.status).toBe(400);
    expect(res.body.details).toContain('description must be a string');
  });

  it('rejects an empty string title with no description', async () => {
    const res = await request(app).post('/v1/issues').send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body.details).toContain('title is required');
    expect(res.body.details).toContain('description is required');
  });

  it('rejects an empty string description with no title', async () => {
    const res = await request(app).post('/v1/issues').send({ description: '' });
    expect(res.status).toBe(400);
    expect(res.body.details).toContain('title is required');
    expect(res.body.details).toContain('description is required');
  });

  it('rejects when both title and description are empty strings', async () => {
    const res = await request(app).post('/v1/issues').send({ title: '', description: '' });
    expect(res.status).toBe(400);
    expect(res.body.details).toContain('title is required');
    expect(res.body.details).toContain('description is required');
  });

  it('rejects a title that is only whitespace', async () => {
    const res = await request(app).post('/v1/issues').send({ title: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.details).toContain('title is required');
    expect(res.body.details).toContain('description is required');
  });

  it('rejects a description that is only whitespace', async () => {
    const res = await request(app).post('/v1/issues').send({ description: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.details).toContain('title is required');
    expect(res.body.details).toContain('description is required');
  });

  it('rejects when both title and description are only whitespace', async () => {
    const res = await request(app).post('/v1/issues').send({ title: '   ', description: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.details).toContain('title is required');
    expect(res.body.details).toContain('description is required');
  });

  it('returns 500 when the database throws', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValueOnce(new Error('DB down'));
    const res = await request(app)
      .post('/v1/issues')
      .send({ title: 'Valid', description: 'Also valid' });
    expect(res.status).toBe(500);
  });
  it('rejects a raw string body', async () => {
    const res = await request(app)
      .post('/v1/issues')
      .set('Content-Type', 'application/json')
      .send('"banana"');
    expect(res.status).toBe(400);
  });

  it('rejects a raw number body', async () => {
    const res = await request(app)
      .post('/v1/issues')
      .set('Content-Type', 'application/json')
      .send('99999');
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET /v1/issues — admin list
// ---------------------------------------------------------------------------

const fakeIssues = [
  {
    id: 1,
    title: 'Bug A',
    description: 'desc',
    status: 'Open',
    createdAt: new Date('2026-05-01'),
    updatedAt: new Date('2026-05-01'),
  },
  {
    id: 2,
    title: 'Bug B',
    description: 'desc',
    status: 'InProgress',
    createdAt: new Date('2026-05-02'),
    updatedAt: new Date('2026-05-02'),
  },
];

describe('GET /v1/issues', () => {
  it('returns paginated issues for admin', async () => {
    (mockIssue.findMany as jest.Mock).mockResolvedValueOnce(fakeIssues);
    (mockIssue.count as jest.Mock).mockResolvedValueOnce(2);

    const res = await request(app).get('/v1/issues').set(asAdmin);
    expect(res.status).toBe(200);
    expect(res.body.issues).toHaveLength(2);
    expect(res.body.total).toBe(2);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(20);
    expect(res.body.pages).toBe(1);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/v1/issues');
    expect(res.status).toBe(401);
  });

  it('returns 403 for regular user', async () => {
    const res = await request(app).get('/v1/issues').set(asUser);
    expect(res.status).toBe(403);
  });

  it('filters by single status', async () => {
    (mockIssue.findMany as jest.Mock).mockResolvedValueOnce([fakeIssues[0]]);
    (mockIssue.count as jest.Mock).mockResolvedValueOnce(1);

    const res = await request(app).get('/v1/issues?status=Open').set(asAdmin);
    expect(res.status).toBe(200);
    expect(res.body.issues).toHaveLength(1);
    expect(mockIssue.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: { in: ['Open'] } } })
    );
  });

  it('filters by multiple comma-separated statuses', async () => {
    (mockIssue.findMany as jest.Mock).mockResolvedValueOnce(fakeIssues);
    (mockIssue.count as jest.Mock).mockResolvedValueOnce(2);

    const res = await request(app).get('/v1/issues?status=Open,InProgress').set(asAdmin);
    expect(res.status).toBe(200);
    expect(mockIssue.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: { in: ['Open', 'InProgress'] } } })
    );
  });

  it('returns 400 for an invalid status value', async () => {
    const res = await request(app).get('/v1/issues?status=Bogus').set(asAdmin);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid status/i);
  });

  it('respects page and limit params', async () => {
    (mockIssue.findMany as jest.Mock).mockResolvedValueOnce([fakeIssues[0]]);
    (mockIssue.count as jest.Mock).mockResolvedValueOnce(10);

    const res = await request(app).get('/v1/issues?page=2&limit=1').set(asAdmin);
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(1);
    expect(mockIssue.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 1, take: 1 }));
  });

  it('sorts oldest-first when ?sort=oldest', async () => {
    (mockIssue.findMany as jest.Mock).mockResolvedValueOnce(fakeIssues);
    (mockIssue.count as jest.Mock).mockResolvedValueOnce(2);

    await request(app).get('/v1/issues?sort=oldest').set(asAdmin);
    expect(mockIssue.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'asc' } })
    );
  });

  it('returns 500 on database error', async () => {
    (mockIssue.findMany as jest.Mock).mockRejectedValueOnce(new Error('DB down'));
    (mockIssue.count as jest.Mock).mockRejectedValueOnce(new Error('DB down'));

    const res = await request(app).get('/v1/issues').set(asAdmin);
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET /v1/issues/:id — admin detail
// ---------------------------------------------------------------------------

describe('GET /v1/issues/:id', () => {
  it('returns a single issue for admin', async () => {
    (mockIssue.findUnique as jest.Mock).mockResolvedValueOnce(fakeIssues[0]);

    const res = await request(app).get('/v1/issues/1').set(asAdmin);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('returns 404 when issue not found', async () => {
    (mockIssue.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app).get('/v1/issues/99').set(asAdmin);
    expect(res.status).toBe(404);
  });

  it('returns 400 for a non-integer id', async () => {
    const res = await request(app).get('/v1/issues/abc').set(asAdmin);
    expect(res.status).toBe(400);
  });

  it('returns 404 for a negative id', async () => {
    const res = await request(app).get('/v1/issues/-1').set(asAdmin);
    expect(res.status).toBe(404);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/v1/issues/1');
    expect(res.status).toBe(401);
  });

  it('returns 403 for regular user', async () => {
    const res = await request(app).get('/v1/issues/1').set(asUser);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// PATCH /v1/issues/:id — admin status update
// ---------------------------------------------------------------------------

describe('PATCH /v1/issues/:id', () => {
  it('updates status for admin', async () => {
    (mockIssue.findUnique as jest.Mock).mockResolvedValueOnce(fakeIssues[0]);
    (mockIssue.update as jest.Mock).mockResolvedValueOnce({ ...fakeIssues[0], status: 'Resolved' });

    const res = await request(app).patch('/v1/issues/1').set(asAdmin).send({ status: 'Resolved' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Resolved');
  });

  it('returns 400 for an unknown status', async () => {
    const res = await request(app).patch('/v1/issues/1').set(asAdmin).send({ status: 'Done' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid status/i);
  });

  it('returns 400 when status field is missing', async () => {
    const res = await request(app).patch('/v1/issues/1').set(asAdmin).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/status/i);
  });

  it('returns 404 when issue not found', async () => {
    (mockIssue.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app).patch('/v1/issues/99').set(asAdmin).send({ status: 'Closed' });
    expect(res.status).toBe(404);
  });

  it('returns 400 for a non-integer id', async () => {
    const res = await request(app).patch('/v1/issues/abc').set(asAdmin).send({ status: 'Closed' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for a negative id', async () => {
    const res = await request(app).patch('/v1/issues/-1').set(asAdmin).send({ status: 'Closed' });
    expect(res.status).toBe(404);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).patch('/v1/issues/1').send({ status: 'Closed' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for regular user', async () => {
    const res = await request(app).patch('/v1/issues/1').set(asUser).send({ status: 'Closed' });
    expect(res.status).toBe(403);
  });

  it('accepts all valid status values', async () => {
    for (const status of ['Open', 'InProgress', 'Resolved', 'Closed']) {
      (mockIssue.findUnique as jest.Mock).mockResolvedValueOnce(fakeIssues[0]);
      (mockIssue.update as jest.Mock).mockResolvedValueOnce({ ...fakeIssues[0], status });
      const res = await request(app).patch('/v1/issues/1').set(asAdmin).send({ status });
      expect(res.status).toBe(200);
    }
  });
});

// ---------------------------------------------------------------------------
// DELETE /v1/issues/:id — admin delete
// ---------------------------------------------------------------------------

describe('DELETE /v1/issues/:id', () => {
  it('deletes an issue for admin, returns 204', async () => {
    (mockIssue.findUnique as jest.Mock).mockResolvedValueOnce(fakeIssues[0]);
    (mockIssue.delete as jest.Mock).mockResolvedValueOnce(fakeIssues[0]);

    const res = await request(app).delete('/v1/issues/1').set(asAdmin);
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('returns 404 when issue not found', async () => {
    (mockIssue.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app).delete('/v1/issues/99').set(asAdmin);
    expect(res.status).toBe(404);
  });

  it('returns 400 for a non-integer id', async () => {
    const res = await request(app).delete('/v1/issues/abc').set(asAdmin);
    expect(res.status).toBe(400);
  });

  it('returns 404 for a negative id', async () => {
    const res = await request(app).delete('/v1/issues/-1').set(asAdmin);
    expect(res.status).toBe(404);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).delete('/v1/issues/1');
    expect(res.status).toBe(401);
  });

  it('returns 403 for regular user', async () => {
    const res = await request(app).delete('/v1/issues/1').set(asUser);
    expect(res.status).toBe(403);
  });

  it('returns 500 on database error', async () => {
    (mockIssue.findUnique as jest.Mock).mockResolvedValueOnce(fakeIssues[0]);
    (mockIssue.delete as jest.Mock).mockRejectedValueOnce(new Error('DB down'));

    const res = await request(app).delete('/v1/issues/1').set(asAdmin);
    expect(res.status).toBe(500);
  });
});
