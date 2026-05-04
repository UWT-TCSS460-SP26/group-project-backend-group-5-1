import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

beforeEach(() => jest.clearAllMocks());

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

  it('creates an issue with only a title', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([fakeRow]);
    const res = await request(app).post('/v1/issues').send({ title: 'Just a title' });
    expect(res.status).toBe(201);
  });

  it('creates an issue with only a description', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([fakeRow]);
    const res = await request(app).post('/v1/issues').send({ description: 'Just a description' });
    expect(res.status).toBe(201);
  });

  it('rejects a body with neither title nor description', async () => {
    const res = await request(app).post('/v1/issues').send({ reporter: 'someone' });
    expect(res.status).toBe(400);
    expect(res.body.details).toContain('A title or description is required');
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

  it('rejects an invalid reporterEmail', async () => {
    const res = await request(app)
      .post('/v1/issues')
      .send({ title: 'Valid', reporterEmail: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.details).toContain('reporterEmail must be a valid email address');
  });

  it('accepts a valid reporterEmail', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([fakeRow]);
    const res = await request(app)
      .post('/v1/issues')
      .send({ title: 'Bug', reporterEmail: 'user@example.com' });
    expect(res.status).toBe(201);
  });

  it('returns 500 when the database throws', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValueOnce(new Error('DB down'));
    const res = await request(app)
      .post('/v1/issues')
      .send({ title: 'Valid', description: 'Also valid' });
    expect(res.status).toBe(500);
  });
});
