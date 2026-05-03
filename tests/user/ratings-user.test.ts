import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { authHeader } from '../helpers';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    rating: {
      findMany: jest.fn(),
    },
  },
}));

const mockRating = prisma.rating as jest.Mocked<typeof prisma.rating>;
const asUser = authHeader({ sub: 'user-1', role: 'User' });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /v1/ratings/me', () => {
  it('returns the authenticated users ratings', async () => {
    (mockRating.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 1,
        mediaId: 120,
        mediaType: 'movie',
        userId: 1,
        score: 8,
        user: { id: 1, username: 'user-1' },
      },
    ]);

    const response = await request(app)
      .get('/v1/ratings/me')
      .set(asUser);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty('score', 8);
    expect(response.body[0]).toHaveProperty('user');
    expect(response.body[0].user).toHaveProperty('username');
  });

  it('returns empty array when user has no ratings', async () => {
    (mockRating.findMany as jest.Mock).mockResolvedValueOnce([]);

    const response = await request(app)
      .get('/v1/ratings/me')
      .set(asUser);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(0);
  });

  it('returns 401 when token is missing', async () => {
    const response = await request(app)
      .get('/v1/ratings/me');

    expect(response.status).toBe(401);
  });
});