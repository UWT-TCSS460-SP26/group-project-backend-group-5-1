import request from 'supertest';
import { app } from '../../../src/app';
 
const mockFetch = jest.fn();
global.fetch = mockFetch;
 
const mockMovieResponse = {
  adult: false,
  backdrop_path: '/2w4xG178RpB4MDAIfTkqAuSJzec.jpg',
  genres: [{ id: 12, name: 'Adventure' }],
  id: 11,
  imdb_id: 'tt0076759',
  origin_country: ['US'],
  original_language: 'en',
  original_title: 'Star Wars',
  overview: 'Princess Leia...',
  popularity: 20.69,
  poster_path: '/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg',
  production_companies: [
    { id: 1, logo_path: '/logo.png', name: 'Lucasfilm', origin_country: 'US' },
  ],
  release_date: '1977-05-25',
  runtime: 121,
  spoken_languages: [{ english_name: 'English', iso_639_1: 'en', name: 'English' }],
  title: 'Star Wars',
};
 
beforeEach(() => {
  mockFetch.mockReset();
  process.env.TMDB_API_KEY = 'test-api-key';
  process.env.TMDB_BASE_URL = 'https://api.themoviedb.org/3';
});
 
describe('Movie Routes', () => {
  describe('GET /v1/movies/:id', () => {
    it('returns 200 on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockMovieResponse,
      });
      const res = await request(app).get('/v1/movies/11');
      expect(res.status).toBe(200);
    });
 
    it('returns 404 when movie not found', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'movie not found' }),
      });
      const res = await request(app).get('/v1/movies/999999');
      expect(res.status).toBe(404);
    });
 
    it('returns 500 on fetch error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      const res = await request(app).get('/v1/movies/11');
      expect(res.status).toBe(500);
    });
  });
});