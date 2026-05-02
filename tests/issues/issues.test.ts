import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { authHeader } from '../helpers';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    issue: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockIssue = prisma.issue as jest.Mocked<typeof prisma.issue>;
const asAdmin = authHeader({ sub: 'admin-1', role: 'Admin' });
const asUser = authHeader({ sub: 'user-1', role: 'User' });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /v1/issues', () => {
  it('creates an issue without authentication', async () => {
    (mockIssue.create as jest.Mock).mockResolvedValueOnce({
      id: 1,
      title: 'Review not posting',
      description: 'I could not get my review to post',
      reproSteps: 'I pushed send and then it would kick me out',
      contact: 'something@gmail.com',
    });

    const response = await request(app)
      .post('/v1/issues')
      .send({
        title: 'Review not posting',
        description: 'I could not get my review to post',
        reproSteps: 'I pushed send and then it would kick me out',
        contact: 'something@gmail.com',
      });

    expect(response.status).toBe(201);
    expect(mockIssue.create).toHaveBeenCalled();
  });

  it('returns 400 when title is missing', async () => {
    const response = await request(app)
      .post('/v1/issues')
      .send({ description: 'Something is broken' });
    expect(response.status).toBe(400);
  });

  it('returns 400 when description is missing', async () => {
    const response = await request(app)
      .post('/v1/issues')
      .send({ title: 'Something is broken' });
    expect(response.status).toBe(400);
  });

  it('returns 400 when both title and description are missing', async () => {
    const response = await request(app)
      .post('/v1/issues')
      .send({ reproSteps: 'Click the button' });
    expect(response.status).toBe(400);
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
    (mockIssue.findMany as jest.Mock).mockResolvedValueOnce([]);
    const response = await request(app)
      .get('/v1/issues')
      .set(asAdmin);
    expect(response.status).toBe(200);
  });
});