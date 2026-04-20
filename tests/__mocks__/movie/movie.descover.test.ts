import request from 'supertest';
import { app } from '../../../src/app';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockDiscoverMoviesResponse = {
  page: 1,
  results: [
    {
      adult: false,
      backdrop_path: '/8YFL5QQVPy3AgrEQxNYVSgiPEbe.jpg',
      genre_ids: [28, 12, 878],
      id: 640146,
      original_language: 'en',
      original_title: 'Ant-Man and the Wasp: Quantumania',
      overview: 'Super-Hero partners Scott Lang and Hope van Dyne...',
      popularity: 9272.643,
      poster_path: '/ngl2FKBlU4fhbdsrtdom9LVLBXw.jpg',
      release_date: '2023-02-15',
      title: 'Ant-Man and the Wasp: Quantumania',
      video: false,
      vote_average: 6.5,
      vote_count: 1856,
    },
  ],
  total_pages: 38020,
  total_results: 760385,
};

beforeEach(() => {
  mockFetch.mockReset();
  process.env.TMDB_API_KEY = 'test-api-key';
  process.env.TMDB_BASE_URL = 'https://api.themoviedb.org/3';
});

describe('Movie Routes', () => {
  describe('GET /v1/movies', () => {
    it('returns 200 on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockDiscoverMoviesResponse,
      });
      const res = await request(app).get('/v1/movies?with_genres=28');
      expect(res.status).toBe(200);
    });

    it('returns 500 on fetch error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      const res = await request(app).get('/v1/movies?with_genres=28');
      expect(res.status).toBe(500);
    });
  });
});
