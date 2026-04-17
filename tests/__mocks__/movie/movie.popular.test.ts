import request from 'supertest';
import { app } from '../src/app';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockPopularMoviesResponse = {
  page: 1,
  results: [
    {
      adult: false,
      backdrop_path: "/gMJngTNfaqCSCqGD4y8lVMZXKDn.jpg",
      genre_ids: [28, 12, 878],
      id: 640146,
      original_language: "en",
      original_title: "Ant-Man and the Wasp: Quantumania",
      overview: "Super-Hero partners Scott Lang and Hope van Dyne...",
      popularity: 8567.865,
      poster_path: "/ngl2FKBlU4fhbdsrtdom9LVLBXw.jpg",
      release_date: "2023-02-15",
      title: "Ant-Man and the Wasp: Quantumania",
    },
  ],
  total_pages: 38029,
  total_results: 760569,
};

beforeEach(() => {
  mockFetch.mockReset();
  process.env.TMDB_API_KEY = 'test-api-key';
});

describe('Movie Routes', () => {

  describe('GET /movie/popular', () => {
    it('returns popular movies on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockPopularMoviesResponse,
      });

      const res = await request(app).get('/movie/popular');
      expect(res.status).toBe(200);
      expect(res.body.results).toBeDefined();
      expect(res.body.results[0].title).toBe('Ant-Man and the Wasp: Quantumania');
      expect(res.body.results[0].id).toBe(640146);
      expect(res.body.results[0].adult).toBe(false);
      expect(res.body.results[0].original_language).toBe('en');
      expect(res.body.results[0].popularity).toBe(8567.865);
      expect(res.body.results[0].release_date).toBe('2023-02-15');
      expect(res.body.page).toBe(1);
    });

    it('returns 502 when fetch throws', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      const res = await request(app).get('/movie/popular');
      expect(res.status).toBe(502);
    });

    it('returns upstream error on API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid API key' }),
      });
      const res = await request(app).get('/movie/popular');
      expect(res.status).toBe(401);
    });
  });
});