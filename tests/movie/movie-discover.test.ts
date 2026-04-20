import request from 'supertest';
import { app } from '../../src/app';
import * as movieService from '../../src/services/movies';

jest.mock('../../src/services/movies', () => ({
  ...jest.requireActual('../../src/services/movies'),
  fetchMoviePage: jest.fn(),
  fetchTmdb: jest.fn(),
  parseMovieQuery: jest.requireActual('../../src/services/movies').parseMovieQuery,
  TMDB_PAGE_SIZE: 20,
}));

const mockMovieResults = [
  {
    backdrop_path: '/9Z2uDYXqJrlmePznQQJhL6d92Rq.jpg',
    id: 1226863,
    title: 'The Super Mario Galaxy Movie',
    poster_path: '/eJGWx219ZcEMVQJhAgMiqo8tYY.jpg',
  },
  {
    backdrop_path: '/1x9e0qWonw634NhIsRdvnneeqvN.jpg',
    id: 1523145,
    title: 'Your Heart Will Be Broken',
    poster_path: '/7wIBfBl2gejt6xHxNSK0reVIm7E.jpg',
  },
  {
    backdrop_path: '/u8DU5fkLoM5tTRukzPC31oGPxaQ.jpg',
    id: 83533,
    title: 'Avatar: Fire and Ash',
    poster_path: '/aabwWZWx6z1aYP4PX2ADvbDKktd.jpg',
  },
];

describe('Movie Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (movieService.fetchMoviePage as jest.Mock).mockResolvedValue(mockMovieResults);
  });

  describe('GET /v1/movies', () => {
    it('returns 200 and correct fields on success', async () => {
      const res = await request(app).get('/v1/movies?with_genres=28');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('title');
      expect(res.body[0]).toHaveProperty('poster_path');
      expect(res.body[0]).toHaveProperty('backdrop_path');
    });

    it('strips fields not in the allowlist', async () => {
      const res = await request(app).get('/v1/movies?with_genres=28');
      expect(res.status).toBe(200);
      expect(res.body[0]).not.toHaveProperty('adult');
      expect(res.body[0]).not.toHaveProperty('popularity');
      expect(res.body[0]).not.toHaveProperty('vote_average');
      expect(res.body[0]).not.toHaveProperty('vote_count');
      expect(res.body[0]).not.toHaveProperty('genre_ids');
      expect(res.body[0]).not.toHaveProperty('original_language');
    });

    it('respects the limit parameter', async () => {
      const manyResults = Array.from({ length: 20 }, (_, i) => ({
        ...mockMovieResults[0],
        id: i + 1,
        title: `Movie ${i + 1}`,
      }));
      (movieService.fetchMoviePage as jest.Mock).mockResolvedValue(manyResults);

      const res = await request(app).get('/v1/movies?limit=3');
      expect(res.status).toBe(200);
      expect(res.body.length).toBeLessThanOrEqual(3);
    });

    it('returns 400 when limit is not a number', async () => {
      const res = await request(app).get('/v1/movies?limit=abc');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toBe('limit must be a positive integer');
    });

    it('returns 400 when limit exceeds maximum', async () => {
      const res = await request(app).get('/v1/movies?limit=999');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toBe('limit must not exceed 50');
    });

    it('returns 500 on fetch error', async () => {
      (movieService.fetchMoviePage as jest.Mock).mockRejectedValue(new Error('Network error'));
      const res = await request(app).get('/v1/movies?with_genres=28');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });
});
