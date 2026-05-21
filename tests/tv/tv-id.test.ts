import request from 'supertest';
import { app } from '../../src/app';
import * as tvService from '../../src/services/tv';
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

jest.mock('../../src/services/tv', () => ({
  ...jest.requireActual('../../src/services/tv'),
  fetchTmdb: jest.fn(),
  fetchTvPage: jest.fn(),
  parseTvQuery: jest.requireActual('../../src/services/tv').parseTvQuery,
  TMDB_PAGE_SIZE: 20,
}));

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    rating: {
      aggregate: jest.fn(),
    },
    review: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const mockTvDetails = {
  id: 123,
  name: 'Test Show',
  original_name: 'Test Show',
  overview: 'A test show overview.',
  tagline: 'Just a test.',
  first_air_date: '2020-01-01',
  last_air_date: '2023-01-01',
  status: 'Ended',
  type: 'Scripted',
  adult: false,
  genres: [{ id: 18, name: 'Drama' }],
  original_language: 'en',
  spoken_languages: [{ english_name: 'English', iso_639_1: 'en', name: 'English' }],
  origin_country: ['US'],
  number_of_episodes: 30,
  number_of_seasons: 3,
  seasons: [{ id: 1, name: 'Season 1', episode_count: 10, air_date: '2020-01-01' }],
  episode_run_time: [45],
  last_episode_to_air: { id: 1, name: 'Finale', episode_number: 10, season_number: 3 },
  next_episode_to_air: null,
  networks: [{ id: 1, name: 'HBO', logo_path: '/hbo.png', origin_country: 'US' }],
  production_companies: [
    { id: 1, name: 'Test Productions', logo_path: null, origin_country: 'US' },
  ],
  production_countries: [{ iso_3166_1: 'US', name: 'United States of America' }],
  created_by: [{ id: 1, name: 'Test Creator', profile_path: null }],
};

describe('GET /v1/tv/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns details when id is provided', async () => {
    (tvService.fetchTmdb as jest.Mock).mockResolvedValue(mockTvDetails);
    (prisma.rating.aggregate as jest.Mock).mockResolvedValue({
      _avg: { score: 9.0 },
      _count: 20,
    });
    (prisma.review.findMany as jest.Mock).mockResolvedValue([
      {
        id: 2,
        body: 'Amazing show!',
        createdAt: new Date('2023-02-01'),
        user: { username: 'user2' },
      },
    ]);
    (prisma.review.count as jest.Mock).mockResolvedValue(8);

    const response = await request(app).get('/v1/tv/123');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('overview');
    expect(response.body).toHaveProperty('first_air_date');
    expect(response.body).toHaveProperty('number_of_seasons');
    expect(response.body).toHaveProperty('networks');
    expect(response.body).toHaveProperty('id', 123); // Now included since no trimming
    expect(response.body).toHaveProperty('community_rating', 9.0);
    expect(response.body).toHaveProperty('community_rating_count', 20);
    expect(response.body).toHaveProperty('review_count', 8);
    expect(response.body).toHaveProperty('recent_reviews');
    expect(response.body.recent_reviews).toHaveLength(1);
    expect(response.body.recent_reviews[0]).toHaveProperty('review_text', 'Amazing show!');
    expect(response.body.recent_reviews[0]).toHaveProperty('user');
    expect(response.body.recent_reviews[0].user).toHaveProperty('username', 'user2');
  });

  it('returns 400 when id is invalid', async () => {
    const response = await request(app).get('/v1/tv/asbad');
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('TV id must be a positive integer');
  });

  it('returns 404 for a negative id', async () => {
    const response = await request(app).get('/v1/tv/-1');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('TV show with id -1 not found');
  });

  it('returns 404 when id is not found', async () => {
    const notFoundError = Object.assign(new Error('TMDB error: 404 Not Found'), { status: 404 });
    (tvService.fetchTmdb as jest.Mock).mockRejectedValue(notFoundError);

    const response = await request(app).get('/v1/tv/999999');
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('TV show with id 999999 not found');
  });
});
