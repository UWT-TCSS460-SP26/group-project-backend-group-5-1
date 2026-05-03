import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { authHeader } from '../helpers';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    issue: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockIssue = prisma.issue as jest.Mocked<typeof prisma.issue>;
const asAdmin = authHeader({ sub: 'admin-1', role: 'Admin' });
const asUser = authHeader({ sub: 'user-1', role: 'User' });

beforeEach(() => {
  jest.clearAllMocks();
});

const mockIssueRow = {
  id: 1,
  title: 'Test issue',
  description: 'Test description',
  reproSteps: null,
  reporter: null,
  reporterEmail: null,
  status: 'NEW' as const,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
};

describe('POST /v1/issues', () => {
  it('creates an issue without authentication', async () => {
    (mockIssue.create as jest.Mock).mockResolvedValueOnce(mockIssueRow);

    const response = await request(app)
      .post('/v1/issues')
      .send({
        title: 'Review not posting',
        description: 'I could not get my review to post',
        reproSteps: 'I pushed send and then it would kick me out',
        reporter: 'Alice',
        reporterEmail: 'alice@example.com',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      issueId: 1,
      status: 'NEW',
      message: 'Bug report submitted successfully',
    });
    expect(mockIssue.create).toHaveBeenCalled();
  });

  it('creates an issue with only a title', async () => {
    (mockIssue.create as jest.Mock).mockResolvedValueOnce(mockIssueRow);

    const response = await request(app)
      .post('/v1/issues')
      .send({ title: 'Something is broken' });

    expect(response.status).toBe(201);
  });

  it('creates an issue with only a description', async () => {
    (mockIssue.create as jest.Mock).mockResolvedValueOnce(mockIssueRow);

    const response = await request(app)
      .post('/v1/issues')
      .send({ description: 'Something is broken' });

    expect(response.status).toBe(201);
  });

  it('returns 400 when both title and description are missing', async () => {
    const response = await request(app)
      .post('/v1/issues')
      .send({ reproSteps: 'Click the button' });

    expect(response.status).toBe(400);
    expect(response.body.details).toContain('A title or description is required');
  });

  it('returns 400 when reporterEmail is invalid', async () => {
    const response = await request(app)
      .post('/v1/issues')
      .send({ title: 'Bug', reporterEmail: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.details).toContain('reporterEmail must be a valid email address');
  });

  it('returns 400 when title is not a string', async () => {
    const response = await request(app)
      .post('/v1/issues')
      .send({ title: 123 });

    expect(response.status).toBe(400);
    expect(response.body.details).toContain('title must be a string');
  });
});

describe('GET /v1/issues (Admin only)', () => {
  it('returns 403 when user is not admin', async () => {
    const response = await request(app)
      .get('/v1/issues')
      .set(asUser);

    expect(response.status).toBe(403);
  });

  it('returns 401 when token is missing', async () => {
    const response = await request(app)
      .get('/v1/issues');

    expect(response.status).toBe(401);
  });

  it('returns 200 when admin requests issues', async () => {
    (mockIssue.findMany as jest.Mock).mockResolvedValueOnce([mockIssueRow]);

    const response = await request(app)
      .get('/v1/issues')
      .set(asAdmin);

    expect(response.status).toBe(200);
  });
});

describe('GET /v1/issues/:id (Admin only)', () => {
  it('returns 200 when admin requests a specific issue', async () => {
    (mockIssue.findUnique as jest.Mock).mockResolvedValueOnce(mockIssueRow);

    const response = await request(app)
      .get('/v1/issues/1')
      .set(asAdmin);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
  });

  it('returns 404 when issue does not exist', async () => {
    (mockIssue.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const response = await request(app)
      .get('/v1/issues/999')
      .set(asAdmin);

    expect(response.status).toBe(404);
  });

  it('returns 403 when user is not admin', async () => {
    const response = await request(app)
      .get('/v1/issues/1')
      .set(asUser);

    expect(response.status).toBe(403);
  });

  it('returns 401 when token is missing', async () => {
    const response = await request(app).get('/v1/issues/1');
    expect(response.status).toBe(401);
  });
});

describe('PATCH /v1/issues/:id (Admin only)', () => {
  it('updates issue status successfully', async () => {
    (mockIssue.findUnique as jest.Mock).mockResolvedValueOnce(mockIssueRow);
    (mockIssue.update as jest.Mock).mockResolvedValueOnce({ ...mockIssueRow, status: 'TRIAGE' });

    const response = await request(app)
      .patch('/v1/issues/1')
      .set(asAdmin)
      .send({ status: 'TRIAGE' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'TRIAGE');
  });

  it('returns 400 when status is invalid', async () => {
    const response = await request(app)
      .patch('/v1/issues/1')
      .set(asAdmin)
      .send({ status: 'FAKE_STATUS' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('returns 400 when status is missing', async () => {
    const response = await request(app)
      .patch('/v1/issues/1')
      .set(asAdmin)
      .send({});

    expect(response.status).toBe(400);
  });

  it('returns 403 when user is not admin', async () => {
    const response = await request(app)
      .patch('/v1/issues/1')
      .set(asUser)
      .send({ status: 'TRIAGE' });

    expect(response.status).toBe(403);
  });

  it('returns 401 when token is missing', async () => {
    const response = await request(app)
      .patch('/v1/issues/1')
      .send({ status: 'TRIAGE' });

    expect(response.status).toBe(401);
  });
});

describe('DELETE /v1/issues/:id (Admin only)', () => {
  it('deletes an issue successfully', async () => {
    (mockIssue.findUnique as jest.Mock).mockResolvedValueOnce(mockIssueRow);
    (mockIssue.delete as jest.Mock).mockResolvedValueOnce(mockIssueRow);

    const response = await request(app)
      .delete('/v1/issues/1')
      .set(asAdmin);

    expect(response.status).toBe(204);
  });

  it('returns 404 when issue does not exist', async () => {
    (mockIssue.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const response = await request(app)
      .delete('/v1/issues/999')
      .set(asAdmin);

    expect(response.status).toBe(404);
  });

  it('returns 403 when user is not admin', async () => {
    const response = await request(app)
      .delete('/v1/issues/1')
      .set(asUser);

    expect(response.status).toBe(403);
  });

  it('returns 401 when token is missing', async () => {
    const response = await request(app)
      .delete('/v1/issues/1');

    expect(response.status).toBe(401);
  });
});