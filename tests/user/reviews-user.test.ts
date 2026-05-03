import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { authHeader } from '../helpers';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    review: {
      findMany: jest.fn(),
    },
  },
}));

const mockReview = prisma.review as jest.Mocked<typeof prisma.review>;
const asUser = authHeader({ sub: 'user-1', role: 'User' });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /v1/reviews/me', () => {
  it('returns the authenticated users reviews', async () => {
    (mockReview.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 1,
        mediaId: 120,
        mediaType: 'movie',
        userId: 1,
        body: 'Great movie!',
        ratingId: 1,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
        user: { id: 1, username: 'user-1' },
      },
    ]);

    const response = await request(app)
      .get('/v1/reviews/me')
      .set(asUser);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty('body', 'Great movie!');
    expect(response.body[0]).toHaveProperty('user');
    expect(response.body[0].user).toHaveProperty('username');
  });

  it('returns empty array when user has no reviews', async () => {
    (mockReview.findMany as jest.Mock).mockResolvedValueOnce([]);

    const response = await request(app)
      .get('/v1/reviews/me')
      .set(asUser);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(0);
  });

  it('returns 401 when token is missing', async () => {
    const response = await request(app)
      .get('/v1/reviews/me');

    expect(response.status).toBe(401);
  });
});
