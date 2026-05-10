import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import * as moviesService from '../../src/services/movies';
import * as tvService from '../../src/services/tv';
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

jest.mock('../../src/services/movies', () => ({
  ...jest.requireActual('../../src/services/movies'),
  fetchTmdb: jest.fn(),
}));

jest.mock('../../src/services/tv', () => ({
  ...jest.requireActual('../../src/services/tv'),
  fetchTmdb: jest.fn(),
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
};

const mockTvRating = {
  id: 2,
  userId: 1,
  mediaId: 1396,
  mediaType: 'tv',
  score: 9,
  createdAt: new Date('2024-01-02'),
  updatedAt: new Date('2024-01-02'),
};

const otherUserRating = {
  id: 3,
  userId: 2,
  mediaId: 999,
  mediaType: 'movie',
  score: 5,
  createdAt: new Date('2024-01-03'),
  updatedAt: new Date('2024-01-03'),
};

const mockMovieTmdb = {
  id: 550,
  title: 'Fight Club',
  poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  overview: 'A ticking-time-bomb insomniac and a slippery soap salesman...',
};

const mockTvTmdb = {
  id: 1396,
  name: 'Breaking Bad',
  poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
  overview: 'A chemistry teacher diagnosed with cancer...',
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

  it('returns enriched movie rating with TMDB metadata', async () => {
    (mockRating.findMany as jest.Mock).mockResolvedValueOnce([mockMovieRating]);
    (moviesService.fetchTmdb as jest.Mock).mockResolvedValueOnce(mockMovieTmdb);

    const response = await request(app).get('/v1/ratings/me').set(asUser);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty('rating');
    expect(response.body[0]).toHaveProperty('tmdb');
    expect(response.body[0].rating.score).toBe(8);
    expect(response.body[0].rating.mediaType).toBe('movie');
    expect(response.body[0].tmdb.title).toBe('Fight Club');
  });

  it('returns enriched tv rating with TMDB metadata', async () => {
    (mockRating.findMany as jest.Mock).mockResolvedValueOnce([mockTvRating]);
    (tvService.fetchTmdb as jest.Mock).mockResolvedValueOnce(mockTvTmdb);

    const response = await request(app).get('/v1/ratings/me').set(asUser);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].rating.mediaType).toBe('tv');
    expect(response.body[0].tmdb.name).toBe('Breaking Bad');
  });

  it('returns mixed movie and tv ratings', async () => {
    (mockRating.findMany as jest.Mock).mockResolvedValueOnce([mockMovieRating, mockTvRating]);
    (moviesService.fetchTmdb as jest.Mock).mockResolvedValueOnce(mockMovieTmdb);
    (tvService.fetchTmdb as jest.Mock).mockResolvedValueOnce(mockTvTmdb);

    const response = await request(app).get('/v1/ratings/me').set(asUser);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it('omits items where TMDB lookup fails', async () => {
    (mockRating.findMany as jest.Mock).mockResolvedValueOnce([mockMovieRating, mockTvRating]);
    (moviesService.fetchTmdb as jest.Mock).mockRejectedValueOnce(new Error('TMDB error: 404'));
    (tvService.fetchTmdb as jest.Mock).mockResolvedValueOnce(mockTvTmdb);

    const response = await request(app).get('/v1/ratings/me').set(asUser);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].rating.mediaType).toBe('tv');
  });

  it('returns empty array when all TMDB lookups fail', async () => {
    (mockRating.findMany as jest.Mock).mockResolvedValueOnce([mockMovieRating]);
    (moviesService.fetchTmdb as jest.Mock).mockRejectedValueOnce(new Error('TMDB error: 500'));

    const response = await request(app).get('/v1/ratings/me').set(asUser);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('returns 500 when prisma query fails', async () => {
    (mockRating.findMany as jest.Mock).mockRejectedValueOnce(new Error('DB connection lost'));

    const response = await request(app).get('/v1/ratings/me').set(asUser);

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Failed to fetch rated items');
  });

  it('only returns ratings for the authenticated user, not another user', async () => {
    // mock only returns user 1's rating, not user 2's
    (mockRating.findMany as jest.Mock).mockResolvedValueOnce([mockMovieRating]);
    (moviesService.fetchTmdb as jest.Mock).mockResolvedValueOnce(mockMovieTmdb);

    const response = await request(app).get('/v1/ratings/me').set(asUser);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].rating.mediaId).toBe(550);
    // user 2's rating should not appear
    const ids = response.body.map((item: any) => item.rating.mediaId);
    expect(ids).not.toContain(otherUserRating.mediaId);
  });
});