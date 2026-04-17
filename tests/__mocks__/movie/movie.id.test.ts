import request from 'supertest';
import { app } from '../src/app';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockMovieResponse = {
  adult: false,
  backdrop_path: "/2w4xG178RpB4MDAIfTkqAuSJzec.jpg",
  genres: [{ id: 12, name: "Adventure" }],
  id: 11,
  imdb_id: "tt0076759",
  origin_country: ["US"],
  original_language: "en",
  original_title: "Star Wars",
  overview: "Princess Leia...",
  popularity: 20.69,
  poster_path: "/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg",
  production_companies: [{ id: 1, logo_path: "/logo.png", name: "Lucasfilm", origin_country: "US" }],
  release_date: "1977-05-25",
  runtime: 121,
  spoken_languages: [{ english_name: "English", iso_639_1: "en", name: "English" }],
  title: "Star Wars",
};



beforeEach(() => {
  mockFetch.mockReset();
  process.env.TMDB_API_KEY = 'test-api-key';
});

describe('Movie Routes', () => {
  describe('GET /movie/:movie_id', () => {
    it('returns transformed movie details', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockMovieResponse,
      });

      const res = await request(app).get('/movie/11');
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Star Wars');
      expect(res.body.id).toBe(11);
      expect(res.body.imdb_id).toBe('tt0076759');
      expect(res.body.adult).toBe(false);
      expect(res.body.genres).toEqual([{ id: 12, name: "Adventure" }]);
      expect(res.body.origin_country).toEqual(["US"]);
      expect(res.body.original_language).toBe('en');
      expect(res.body.runtime).toBe(121);
      expect(res.body.release_date).toBe('1977-05-25');
      expect(res.body.production_companies[0].name).toBe('Lucasfilm');
      expect(res.body.spoken_languages[0].english_name).toBe('English');
    });

    it('returns 404 when movie not found', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'movie not found' }),
      });
      const res = await request(app).get('/movie/999999');
      expect(res.status).toBe(404);
    });

    it('returns 502 when fetch throws', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      const res = await request(app).get('/movie/11');
      expect(res.status).toBe(502);
    });
  });
  describe('Missing API key', () => {
    it('returns 500 when TMDB_API_KEY is not set', async () => {
      delete process.env.TMDB_API_KEY;
      const res = await request(app).get('/movie/11');
      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/TMDB_API_KEY/);
    });
  });
});