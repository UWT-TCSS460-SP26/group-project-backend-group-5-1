import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { authHeader } from '../helpers';

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

beforeEach(() => jest.clearAllMocks());

const asAdmin = authHeader({ sub: 1, role: 'Admin' });
const asUser = authHeader({ sub: 2, role: 'User' });

const fakeIssue = {
  id: 1,
  title: 'Something broke',
  description: 'It broke badly',
  status: 'Open',
  createdAt: new Date('2026-05-01T00:00:00Z'),
  updatedAt: new Date('2026-05-01T00:00:00Z'),
};

const fakeIssue2 = {
  id: 2,
  title: 'A different bug',
  description: 'This one is different',
  status: 'Open',
  createdAt: new Date('2026-05-02T00:00:00Z'),
  updatedAt: new Date('2026-05-02T00:00:00Z'),
};

describe('GET /v1/issues', () => {
  it('returns list of issues for admin', async () => {
    (prisma.issue.findMany as jest.Mock).mockResolvedValueOnce([fakeIssue]);
    (prisma.issue.count as jest.Mock).mockResolvedValueOnce(1);
    const res = await request(app).get('/v1/issues').set(asAdmin);
    expect(res.status).toBe(200);
    expect(res.body.issues).toHaveLength(1);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/v1/issues');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    const res = await request(app).get('/v1/issues').set(asUser);
    expect(res.status).toBe(403);
  });
});

describe('GET /v1/issues/:id', () => {
  it('returns a single issue for admin', async () => {
    (prisma.issue.findUnique as jest.Mock).mockResolvedValueOnce(fakeIssue);
    const res = await request(app).get('/v1/issues/1').set(asAdmin);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('returns 404 if issue not found', async () => {
    (prisma.issue.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const res = await request(app).get('/v1/issues/999').set(asAdmin);
    expect(res.status).toBe(404);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/v1/issues/1');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    const res = await request(app).get('/v1/issues/1').set(asUser);
    expect(res.status).toBe(403);
  });
});

describe('PATCH /v1/issues/:id', () => {
  it('updates status to InProgress', async () => {
    (prisma.issue.findUnique as jest.Mock).mockResolvedValueOnce(fakeIssue);
    (prisma.issue.update as jest.Mock).mockResolvedValueOnce({
      ...fakeIssue,
      status: 'InProgress',
    });
    const res = await request(app)
      .patch('/v1/issues/1')
      .set(asAdmin)
      .send({ status: 'InProgress' });
    expect(res.status).toBe(200);
  });

  it('updates status to Resolved', async () => {
    (prisma.issue.findUnique as jest.Mock).mockResolvedValueOnce(fakeIssue);
    (prisma.issue.update as jest.Mock).mockResolvedValueOnce({ ...fakeIssue, status: 'Resolved' });
    const res = await request(app).patch('/v1/issues/1').set(asAdmin).send({ status: 'Resolved' });
    expect(res.status).toBe(200);
  });

  it('rejects an invalid status string', async () => {
    const res = await request(app).patch('/v1/issues/1').set(asAdmin).send({ status: 'banana' });
    expect(res.status).toBe(400);
  });

  it('returns 404 if issue not found', async () => {
    (prisma.issue.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const res = await request(app).patch('/v1/issues/1').set(asAdmin).send({ status: 'Resolved' });
    expect(res.status).toBe(404);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).patch('/v1/issues/1').send({ status: 'Resolved' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    const res = await request(app).patch('/v1/issues/1').set(asUser).send({ status: 'Resolved' });
    expect(res.status).toBe(403);
  });

  it('does not update a different issue', async () => {
    (prisma.issue.findUnique as jest.Mock).mockResolvedValueOnce(fakeIssue2);
    (prisma.issue.update as jest.Mock).mockResolvedValueOnce({ ...fakeIssue2, status: 'Resolved' });
    const res = await request(app).patch('/v1/issues/2').set(asAdmin).send({ status: 'Resolved' });
    expect(res.status).toBe(200);
    // issue 1 should still be Open
    (prisma.issue.findUnique as jest.Mock).mockResolvedValueOnce(fakeIssue);
    const check = await request(app).get('/v1/issues/1').set(asAdmin);
    expect(check.status).toBe(200);
    expect(check.body.status).toBe('Open');
  });
});

describe('DELETE /v1/issues/:id', () => {
  it('deletes an issue as admin', async () => {
    (prisma.issue.findUnique as jest.Mock).mockResolvedValueOnce(fakeIssue);
    (prisma.issue.delete as jest.Mock).mockResolvedValueOnce(fakeIssue);
    const res = await request(app).delete('/v1/issues/1').set(asAdmin);
    expect(res.status).toBe(204);
  });

  it('returns 404 if issue not found', async () => {
    (prisma.issue.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const res = await request(app).delete('/v1/issues/999').set(asAdmin);
    expect(res.status).toBe(404);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).delete('/v1/issues/1');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    const res = await request(app).delete('/v1/issues/1').set(asUser);
    expect(res.status).toBe(403);
  });

  it('does not delete a different issue', async () => {
    (prisma.issue.findUnique as jest.Mock).mockResolvedValueOnce(fakeIssue2);
    (prisma.issue.delete as jest.Mock).mockResolvedValueOnce(fakeIssue2);
    const res = await request(app).delete('/v1/issues/2').set(asAdmin);
    expect(res.status).toBe(204);
    // issue 1 should still exist
    (prisma.issue.findUnique as jest.Mock).mockResolvedValueOnce(fakeIssue);
    const check = await request(app).get('/v1/issues/1').set(asAdmin);
    expect(check.status).toBe(200);
    expect(check.body.id).toBe(1);
  });
});
