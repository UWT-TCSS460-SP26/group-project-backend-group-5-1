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
        (req as any).localUser = { id: Number(req.user.sub) };
      }
      next();
    }
  ),
}));

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    rating: {
      findMany: jest.fn(),
    },
  },
}));

const mockRating = prisma.rating as jest.Mocked<typeof prisma.rating>;
const asUser = authHeader({ sub: 1, role: 'User' });

const mockMovieRating = {
  id: 1,
  userId: 1,
  mediaId: 550,
  mediaType: 'movie',
  score: 8,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  user: { id: 1, username: 'alice', firstName: 'Alice', lastName: 'Smith' },
};

const mockTvRating = {
  id: 2,
  userId: 1,
  mediaId: 1396,
  mediaType: 'tv',
  score: 9,
  createdAt: new Date('2024-01-02'),
  updatedAt: new Date('2024-01-02'),
  user: { id: 1, username: 'alice', firstName: 'Alice', lastName: 'Smith' },
};

const otherUserRating = {
  id: 3,
  userId: 2,
  mediaId: 999,
  mediaType: 'movie',
  score: 5,
  createdAt: new Date('2024-01-03'),
  updatedAt: new Date('2024-01-03'),
  user: { id: 2, username: 'bob', firstName: 'Bob', lastName: 'Jones' },
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /v1/ratings/me', () => {
  it('returns 401 when token is missing', async () => {
    const response = await request(app).get('/v1/ratings/me');
    expect(response.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const response = await request(app)
      .get('/v1/ratings/me')
      .set({ Authorization: 'Bearer not.a.valid.token' });
    expect(response.status).toBe(401);
  });

  it('returns empty array when user has no ratings', async () => {
    (mockRating.findMany as jest.Mock).mockResolvedValueOnce([]);

    const response = await request(app).get('/v1/ratings/me').set(asUser);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('returns a movie rating with correct fields and author', async () => {
    (mockRating.findMany as jest.Mock).mockResolvedValueOnce([mockMovieRating]);

    const response = await request(app).get('/v1/ratings/me').set(asUser);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe(1);
    expect(response.body[0].mediaId).toBe(550);
    expect(response.body[0].mediaType).toBe('movie');
    expect(response.body[0].score).toBe(8);
    expect(response.body[0].author).toEqual({ id: 1, displayName: 'Alice Smith' });
  });

  it('returns a tv rating with correct fields', async () => {
    (mockRating.findMany as jest.Mock).mockResolvedValueOnce([mockTvRating]);

    const response = await request(app).get('/v1/ratings/me').set(asUser);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].mediaType).toBe('tv');
    expect(response.body[0].mediaId).toBe(1396);
    expect(response.body[0].score).toBe(9);
    expect(response.body[0].author).toEqual({ id: 1, displayName: 'Alice Smith' });
  });

  it('returns multiple ratings', async () => {
    (mockRating.findMany as jest.Mock).mockResolvedValueOnce([mockMovieRating, mockTvRating]);

    const response = await request(app).get('/v1/ratings/me').set(asUser);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it('only returns ratings for the authenticated user, not another user', async () => {
    (mockRating.findMany as jest.Mock).mockResolvedValueOnce([mockMovieRating]);

    const response = await request(app).get('/v1/ratings/me').set(asUser);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].mediaId).toBe(550);
    const ids = response.body.map((item: { mediaId: number }) => item.mediaId);
    expect(ids).not.toContain(otherUserRating.mediaId);
  });

  it('returns 500 when prisma query fails', async () => {
    (mockRating.findMany as jest.Mock).mockRejectedValueOnce(new Error('DB connection lost'));

    const response = await request(app).get('/v1/ratings/me').set(asUser);

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Failed to fetch rated items');
  });
});
