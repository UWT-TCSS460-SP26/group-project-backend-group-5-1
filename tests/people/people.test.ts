import request from 'supertest';
import { app } from '../../src/app';
import * as movieService from '../../src/services/movies';
import { prisma } from '../../src/lib/prisma';

jest.mock('../../src/middleware/resolveLocalUser', () => ({
  resolveLocalUser: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock('express-jwt', () => ({
  expressjwt: jest.fn(() => jest.fn()),
}));

jest.mock('jwks-rsa', () => ({
  expressJwtSecret: jest.fn(() => jest.fn()),
}));

jest.mock('../../src/services/movies', () => ({
  ...jest.requireActual('../../src/services/movies'),
  fetchTmdb: jest.fn(),
}));

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    rating: {
      groupBy: jest.fn(),
    },
  },
}));

const mockPersonSearchResponse = {
  results: [{ id: 1190668, name: 'Ryan Gosling' }],
  total_results: 1,
};

const mockEmptyPersonSearchResponse = {
  results: [],
  total_results: 0,
};

const mockCombinedCredits = {
  cast: [
    {
      id: 1100782,
      media_type: 'movie',
      title: 'The Fall Guy',
      overview: 'A stuntman risks everything for his director.',
      release_date: '2024-05-01',
      poster_path: '/tSz1qsmSJon0rqjHBxXZmrotuse.jpg',
      character: 'Colt Seavers',
    },
    {
      id: 114472,
      media_type: 'tv',
      name: 'Community',
      overview: 'Study group becomes a family.',
      first_air_date: '2009-09-17',
      poster_path: '/3SRIAGpBBBiGfHUF1Xis4q5vsSh.jpg',
      character: 'Guest Star',
    },
  ],
};

describe('GET /v1/people/search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 with enriched results when a valid person name is found', async () => {
    (movieService.fetchTmdb as jest.Mock)
      .mockResolvedValueOnce(mockPersonSearchResponse)
      .mockResolvedValueOnce(mockCombinedCredits);
    (prisma.rating.groupBy as jest.Mock).mockResolvedValue([
      { mediaId: 1100782, _avg: { score: 8.5 }, _count: { id: 10 } },
    ]);

    const res = await request(app).get('/v1/people/search?name=Ryan+Gosling');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('title');
    expect(res.body[0]).toHaveProperty('media_type');
    expect(res.body[0]).toHaveProperty('overview');
    expect(res.body[0]).toHaveProperty('release_date');
    expect(res.body[0]).toHaveProperty('poster_path');
    expect(res.body[0]).toHaveProperty('character');
    expect(res.body[0]).toHaveProperty('community_rating');
    expect(res.body[0]).toHaveProperty('community_rating_count');
  });

  it('returns 404 when TMDB finds no matching person', async () => {
    (movieService.fetchTmdb as jest.Mock).mockResolvedValueOnce(mockEmptyPersonSearchResponse);

    const res = await request(app).get('/v1/people/search?name=UnknownPerson12345');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Person not found');
  });

  it('filters by media_type=movie correctly', async () => {
    (movieService.fetchTmdb as jest.Mock)
      .mockResolvedValueOnce(mockPersonSearchResponse)
      .mockResolvedValueOnce(mockCombinedCredits);
    (prisma.rating.groupBy as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get('/v1/people/search?name=Ryan+Gosling&media_type=movie');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.every((item: { media_type: string }) => item.media_type === 'movie')).toBe(
      true
    );
  });

  it('filters by media_type=tv correctly', async () => {
    (movieService.fetchTmdb as jest.Mock)
      .mockResolvedValueOnce(mockPersonSearchResponse)
      .mockResolvedValueOnce(mockCombinedCredits);
    (prisma.rating.groupBy as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get('/v1/people/search?name=Ryan+Gosling&media_type=tv');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.every((item: { media_type: string }) => item.media_type === 'tv')).toBe(true);
  });

  it('returns 400 when name query param is missing', async () => {
    const res = await request(app).get('/v1/people/search');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('correctly merges community rating data — null when no ratings exist', async () => {
    (movieService.fetchTmdb as jest.Mock)
      .mockResolvedValueOnce(mockPersonSearchResponse)
      .mockResolvedValueOnce(mockCombinedCredits);
    (prisma.rating.groupBy as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get('/v1/people/search?name=Ryan+Gosling');
    expect(res.status).toBe(200);
    expect(res.body[0].community_rating).toBeNull();
    expect(res.body[0].community_rating_count).toBe(0);
  });

  it('respects the limit query parameter', async () => {
    (movieService.fetchTmdb as jest.Mock)
      .mockResolvedValueOnce(mockPersonSearchResponse)
      .mockResolvedValueOnce(mockCombinedCredits);
    (prisma.rating.groupBy as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get('/v1/people/search?name=Ryan+Gosling&limit=1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});
