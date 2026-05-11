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
    review: {
      findMany: jest.fn(),
    },
  },
}));

const mockReview = prisma.review as jest.Mocked<typeof prisma.review>;
const asUser = authHeader({ sub: 1, role: 'User' });

const mockMovieReview = {
  id: 1,
  userId: 1,
  mediaId: 550,
  mediaType: 'movie',
  body: 'An incredible film that changed my perspective.',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  author: {
    id: 1,
    username: 'alice',
  },
};

const mockTvReview = {
  id: 2,
  userId: 1,
  mediaId: 1396,
  mediaType: 'tv',
  body: 'One of the best shows ever made.',
  createdAt: new Date('2024-01-02'),
  updatedAt: new Date('2024-01-02'),
  author: {
    id: 1,
    username: 'alice',
  },
};

const otherUserReview = {
  id: 3,
  userId: 2,
  mediaId: 999,
  mediaType: 'movie',
  body: "This is another user's review.",
  createdAt: new Date('2024-01-03'),
  updatedAt: new Date('2024-01-03'),
  author: {
    id: 2,
    username: 'bob',
  },
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /v1/reviews/me', () => {
  it('returns 401 when token is missing', async () => {
    const response = await request(app).get('/v1/reviews/me');
    expect(response.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const response = await request(app)
      .get('/v1/reviews/me')
      .set({ Authorization: 'Bearer not.a.valid.token' });
    expect(response.status).toBe(401);
  });

  it('returns empty array when user has no reviews', async () => {
    (mockReview.findMany as jest.Mock).mockResolvedValueOnce([]);

    const response = await request(app).get('/v1/reviews/me').set(asUser);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('returns a movie review with correct fields', async () => {
    (mockReview.findMany as jest.Mock).mockResolvedValueOnce([mockMovieReview]);

    const response = await request(app).get('/v1/reviews/me').set(asUser);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty('id', 1);
    expect(response.body[0]).toHaveProperty('mediaId', 550);
    expect(response.body[0]).toHaveProperty('mediaType', 'movie');
    expect(response.body[0]).toHaveProperty(
      'body',
      'An incredible film that changed my perspective.'
    );
  });

  it('returns a tv review with correct fields', async () => {
    (mockReview.findMany as jest.Mock).mockResolvedValueOnce([mockTvReview]);

    const response = await request(app).get('/v1/reviews/me').set(asUser);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty('mediaType', 'tv');
    expect(response.body[0]).toHaveProperty('mediaId', 1396);
  });

  it('returns multiple reviews across different media types', async () => {
    (mockReview.findMany as jest.Mock).mockResolvedValueOnce([mockMovieReview, mockTvReview]);

    const response = await request(app).get('/v1/reviews/me').set(asUser);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it('includes author object with id and display name on each review', async () => {
    (mockReview.findMany as jest.Mock).mockResolvedValueOnce([mockMovieReview]);

    const response = await request(app).get('/v1/reviews/me').set(asUser);

    expect(response.status).toBe(200);
    expect(response.body[0]).toHaveProperty('author');
    expect(response.body[0].author).toHaveProperty('id');
    expect(response.body[0].author).toHaveProperty('displayName');
  });

  it('only returns reviews for the authenticated user, not another user', async () => {
    // mock only returns user 1's review, not user 2's
    (mockReview.findMany as jest.Mock).mockResolvedValueOnce([mockMovieReview]);

    const response = await request(app).get('/v1/reviews/me').set(asUser);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].mediaId).toBe(550);
    // user 2's review should not appear
    const ids = response.body.map((item: { mediaId: number }) => item.mediaId);
    expect(ids).not.toContain(otherUserReview.mediaId);
  });

  it('returns 500 when prisma query fails', async () => {
    (mockReview.findMany as jest.Mock).mockRejectedValueOnce(new Error('DB connection lost'));

    const response = await request(app).get('/v1/reviews/me').set(asUser);

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Failed to fetch user reviews');
  });
});
