import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import * as moviesService from '../../src/services/movies';
import * as tvService from '../../src/services/tv';

jest.mock('../../src/middleware/resolveLocalUser', () => ({
  resolveLocalUser: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock('express-jwt', () => ({
  expressjwt: jest.fn(() => jest.fn()),
}));

jest.mock('jwks-rsa', () => ({
  expressJwtSecret: jest.fn(() => jest.fn()),
}));

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    rating: {
      groupBy: jest.fn(),
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

const mockMovieAggregate = {
  mediaId: 550,
  mediaType: 'movie',
  _avg: { score: 9.2 },
  _count: { score: 15 },
};

const mockTvAggregate = {
  mediaId: 1396,
  mediaType: 'tv',
  _avg: { score: 8.8 },
  _count: { score: 12 },
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

describe('GET /v1/discover/top-rated', () => {
  it('returns empty array when no items meet the minimum rating count', async () => {
    (mockRating.groupBy as jest.Mock).mockResolvedValueOnce([]);

    const response = await request(app).get('/v1/discover/top-rated');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('returns enriched movie result with community and TMDB data', async () => {
    (mockRating.groupBy as jest.Mock).mockResolvedValueOnce([mockMovieAggregate]);
    (moviesService.fetchTmdb as jest.Mock).mockResolvedValueOnce(mockMovieTmdb);

    const response = await request(app).get('/v1/discover/top-rated');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty('mediaId', 550);
    expect(response.body[0]).toHaveProperty('mediaType', 'movie');
    expect(response.body[0]).toHaveProperty('community_rating', 9.2);
    expect(response.body[0]).toHaveProperty('community_rating_count', 15);
    expect(response.body[0]).toHaveProperty('tmdb');
    expect(response.body[0].tmdb.title).toBe('Fight Club');
  });

  it('returns enriched tv result with community and TMDB data', async () => {
    (mockRating.groupBy as jest.Mock).mockResolvedValueOnce([mockTvAggregate]);
    (tvService.fetchTmdb as jest.Mock).mockResolvedValueOnce(mockTvTmdb);

    const response = await request(app).get('/v1/discover/top-rated');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].mediaType).toBe('tv');
    expect(response.body[0].tmdb.name).toBe('Breaking Bad');
  });

  it('returns mixed movie and tv results', async () => {
    (mockRating.groupBy as jest.Mock).mockResolvedValueOnce([mockMovieAggregate, mockTvAggregate]);
    (moviesService.fetchTmdb as jest.Mock).mockResolvedValueOnce(mockMovieTmdb);
    (tvService.fetchTmdb as jest.Mock).mockResolvedValueOnce(mockTvTmdb);

    const response = await request(app).get('/v1/discover/top-rated');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it('omits items where TMDB lookup fails', async () => {
    (mockRating.groupBy as jest.Mock).mockResolvedValueOnce([mockMovieAggregate, mockTvAggregate]);
    (moviesService.fetchTmdb as jest.Mock).mockRejectedValueOnce(new Error('TMDB error: 404'));
    (tvService.fetchTmdb as jest.Mock).mockResolvedValueOnce(mockTvTmdb);

    const response = await request(app).get('/v1/discover/top-rated');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].mediaType).toBe('tv');
  });

  it('is a public route — no token required', async () => {
    (mockRating.groupBy as jest.Mock).mockResolvedValueOnce([]);

    const response = await request(app).get('/v1/discover/top-rated');

    expect(response.status).toBe(200);
  });

  it('returns 500 when prisma query fails', async () => {
    (mockRating.groupBy as jest.Mock).mockRejectedValueOnce(new Error('DB connection lost'));

    const response = await request(app).get('/v1/discover/top-rated');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Failed to fetch top-rated items');
  });
});

describe('GET /v1/discover/most-reviewed', () => {
  it('returns empty array when no ratings exist', async () => {
    (mockRating.groupBy as jest.Mock).mockResolvedValueOnce([]);

    const response = await request(app).get('/v1/discover/most-reviewed');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('returns enriched result ordered by review count', async () => {
    (mockRating.groupBy as jest.Mock).mockResolvedValueOnce([mockTvAggregate, mockMovieAggregate]);
    (tvService.fetchTmdb as jest.Mock).mockResolvedValueOnce(mockTvTmdb);
    (moviesService.fetchTmdb as jest.Mock).mockResolvedValueOnce(mockMovieTmdb);

    const response = await request(app).get('/v1/discover/most-reviewed');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toHaveProperty('community_rating_count');
    expect(response.body[0]).toHaveProperty('tmdb');
  });

  it('omits items where TMDB lookup fails', async () => {
    (mockRating.groupBy as jest.Mock).mockResolvedValueOnce([mockMovieAggregate, mockTvAggregate]);
    (moviesService.fetchTmdb as jest.Mock).mockRejectedValueOnce(new Error('TMDB error: 404'));
    (tvService.fetchTmdb as jest.Mock).mockResolvedValueOnce(mockTvTmdb);

    const response = await request(app).get('/v1/discover/most-reviewed');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].mediaType).toBe('tv');
  });

  it('is a public route — no token required', async () => {
    (mockRating.groupBy as jest.Mock).mockResolvedValueOnce([]);

    const response = await request(app).get('/v1/discover/most-reviewed');

    expect(response.status).toBe(200);
  });

  it('returns 500 when prisma query fails', async () => {
    (mockRating.groupBy as jest.Mock).mockRejectedValueOnce(new Error('DB connection lost'));

    const response = await request(app).get('/v1/discover/most-reviewed');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Failed to fetch most-reviewed items');
  });
});
