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
});
describe('Movie Routes', () => {
  describe('GET /v1/movies', () => {
    it('returns filtered movies on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockDiscoverMoviesResponse,
      });
      const res = await request(app).get('/v1/movies?genre=28&year=2023');
      expect(res.status).toBe(200);
      expect(res.body.results).toBeDefined();
      expect(res.body.results[0].title).toBe('Ant-Man and the Wasp: Quantumania');
      expect(res.body.results[0].id).toBe(640146);
      expect(res.body.results[0].genre_ids).toContain(28);
      expect(res.body.total_pages).toBe(38020);
      expect(res.body.total_results).toBe(760385);
    });
    it('returns 400 when no filters provided', async () => {
      const res = await request(app).get('/v1/movies');
      expect(res.status).toBe(400);
    });
    it('returns upstream error on API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid API key' }),
      });
      const res = await request(app).get('/v1/movies?genre=28');
      expect(res.status).toBe(401);
    });
    it('returns 502 when fetch throws', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      const res = await request(app).get('/v1/movies?genre=28');
      expect(res.status).toBe(502);
    });
  });
  describe('Missing API key', () => {
    it('returns 500 when TMDB_API_KEY is not set', async () => {
      delete process.env.TMDB_API_KEY;
      const res = await request(app).get('/v1/movies');
      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/TMDB_API_KEY/);
    });
    it('blocks discover/movie route when key is missing', async () => {
      delete process.env.TMDB_API_KEY;
      const res = await request(app).get('/v1/movies');
      expect(res.status).toBe(500);
    });
  });
});
