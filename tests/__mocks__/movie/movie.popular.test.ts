import request from 'supertest';
import { app } from '../../../src/app';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockPopularMoviesResponse = {
  page: 1,
  results: [
    {
      adult: false,
      backdrop_path: '/gMJngTNfaqCSCqGD4y8lVMZXKDn.jpg',
      genre_ids: [28, 12, 878],
      id: 640146,
      original_language: 'en',
      original_title: 'Ant-Man and the Wasp: Quantumania',
      overview: 'Super-Hero partners Scott Lang and Hope van Dyne...',
      popularity: 8567.865,
      poster_path: '/ngl2FKBlU4fhbdsrtdom9LVLBXw.jpg',
      release_date: '2023-02-15',
      title: 'Ant-Man and the Wasp: Quantumania',
    },
  ],
  total_pages: 38029,
  total_results: 760569,
};

beforeEach(() => {
  mockFetch.mockReset();
  process.env.TMDB_API_KEY = 'test-api-key';
  process.env.TMDB_BASE_URL = 'https://api.themoviedb.org/3';
});

describe('Movie Routes', () => {
  describe('GET /v1/movies/popular', () => {
    it('returns 200 on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockPopularMoviesResponse,
      });
      const res = await request(app).get('/v1/movies/popular');
      expect(res.status).toBe(200);
    });

    it('returns 500 on fetch error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      const res = await request(app).get('/v1/movies/popular');
      expect(res.status).toBe(500);
    });
  });
});
