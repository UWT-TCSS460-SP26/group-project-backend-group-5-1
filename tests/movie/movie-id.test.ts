import request from 'supertest';
import { app } from '../../src/app';
import * as movieService from '../../src/services/movies';
import { prisma } from '../../src/lib/prisma';

jest.mock('express-jwt', () => ({
  expressjwt: jest.fn(() => jest.fn()),
}));

jest.mock('jwks-rsa', () => ({
  expressJwtSecret: jest.fn(() => jest.fn()),
}));

jest.mock('../../src/services/movies', () => ({
  ...jest.requireActual('../../src/services/movies'),
  fetchTmdb: jest.fn(),
  fetchMoviePage: jest.fn(),
  parseMovieQuery: jest.requireActual('../../src/services/movies').parseMovieQuery,
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

const mockMovieResponse = {
  id: 11,
  title: 'Star Wars',
  original_title: 'Star Wars',
  overview: 'Princess Leia...',
  tagline: 'A long time ago in a galaxy far, far away....',
  runtime: 121,
  release_date: '1977-05-25',
  status: 'Released',
  adult: false,
  genre_ids: [12],
  genres: [{ id: 12, name: 'Adventure' }],
  original_language: 'en',
  spoken_languages: [{ english_name: 'English', iso_639_1: 'en', name: 'English' }],
  budget: 11000000,
  revenue: 775398007,
  popularity: 82.5,
  vote_average: 8.6,
  vote_count: 21000,
  poster_path: '/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg',
  backdrop_path: '/2w4xG178RpB4MDAIfTkqAuSJzec.jpg',
  imdb_id: 'tt0076759',
  production_companies: [
    { id: 1, logo_path: '/logo.png', name: 'Lucasfilm Ltd.', origin_country: 'US' },
  ],
  production_countries: [{ iso_3166_1: 'US', name: 'United States of America' }],
  belongs_to_collection: {
    id: 10,
    name: 'Star Wars Collection',
    poster_path: '/iTQHKziZy29ocjNhNlY4mBC2rjA.jpg',
    backdrop_path: '/d8duYyyC9J5T825Hg7grmaabfxQ.jpg',
  },
};

describe('GET /v1/movies/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 and correct fields on success', async () => {
    (movieService.fetchTmdb as jest.Mock).mockResolvedValue(mockMovieResponse);
    (prisma.rating.aggregate as jest.Mock).mockResolvedValue({
      _avg: { score: 8.5 },
      _count: 10,
    });
    (prisma.review.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        body: 'Great movie!',
        createdAt: new Date('2023-01-01'),
        user: { username: 'user1' },
      },
    ]);
    (prisma.review.count as jest.Mock).mockResolvedValue(5);

    const res = await request(app).get('/v1/movies/11');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('overview');
    expect(res.body).toHaveProperty('runtime');
    expect(res.body).toHaveProperty('release_date');
    expect(res.body).toHaveProperty('genres');
    expect(res.body).toHaveProperty('budget');
    expect(res.body).toHaveProperty('revenue');
    expect(res.body).toHaveProperty('belongs_to_collection');
    expect(res.body).toHaveProperty('production_companies');
    expect(res.body).toHaveProperty('imdb_id');
    expect(res.body).toHaveProperty('community_rating', 8.5);
    expect(res.body).toHaveProperty('community_rating_count', 10);
    expect(res.body).toHaveProperty('review_count', 5);
    expect(res.body).toHaveProperty('recent_reviews');
    expect(res.body.recent_reviews).toHaveLength(1);
    expect(res.body.recent_reviews[0]).toHaveProperty('review_text', 'Great movie!');
    expect(res.body.recent_reviews[0]).toHaveProperty('user');
    expect(res.body.recent_reviews[0].user).toHaveProperty('username', 'user1');
  });

  it('returns full TMDB data without stripping fields', async () => {
    (movieService.fetchTmdb as jest.Mock).mockResolvedValue(mockMovieResponse);
    (prisma.rating.aggregate as jest.Mock).mockResolvedValue({
      _avg: { score: null },
      _count: 0,
    });
    (prisma.review.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.review.count as jest.Mock).mockResolvedValue(0);

    const res = await request(app).get('/v1/movies/11');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('community_rating', null);
    expect(res.body).toHaveProperty('community_rating_count', 0);
    expect(res.body).toHaveProperty('review_count', 0);
    expect(res.body.recent_reviews).toEqual([]);
  });

  it('returns 400 when id is invalid', async () => {
    const res = await request(app).get('/v1/movies/abc');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toBe('Movie id must be a positive integer');
  });

  it('returns 404 for a negative id', async () => {
    const res = await request(app).get('/v1/movies/-1');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Movie with id -1 not found');
  });

  it('returns 404 when movie is not found', async () => {
    const notFoundError = Object.assign(new Error('TMDB error: 404 Not Found'), { status: 404 });
    (movieService.fetchTmdb as jest.Mock).mockRejectedValue(notFoundError);

    const res = await request(app).get('/v1/movies/999999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toBe('Movie with id 999999 not found');
  });

  it('returns 500 on fetch error', async () => {
    (movieService.fetchTmdb as jest.Mock).mockRejectedValue(new Error('Network error'));

    const res = await request(app).get('/v1/movies/11');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});
