import request from 'supertest';
import { app } from '../../src/app';
import tmdb from '../../src/config/tmdbClient';

jest.mock('../../src/config/tmdbClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockTvSearchResponse = {
  page: 1,
  results: [
    {
      id: 4607,
      name: 'Lost',
      poster_path: '/og65OaTZU6YUJAbqxeKjCa3kY1E.jpg',
      first_air_date: '2004-09-22',
    },
    {
      id: 1396,
      name: 'Breaking Bad',
      poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      first_air_date: '2008-01-20',
    },
  ],
  total_pages: 25,
  total_results: 496,
};

beforeEach(() => {
  (tmdb.get as jest.Mock).mockReset();
});

describe('TV Routes', () => {
  describe('GET /v1/tv/search', () => {
    it('returns 200 and results when q is provided', async () => {
      (tmdb.get as jest.Mock).mockResolvedValue({ data: mockTvSearchResponse });
      const res = await request(app).get('/v1/tv/search?q=lost');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        page: 1,
        totalPages: 25,
        totalResults: 496,
        results: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            title: expect.any(String),
          }),
        ]),
      });
    });

    it('returns 400 when q is missing', async () => {
      const res = await request(app).get('/v1/tv/search');
      expect(res.status).toBe(400);
    });

    it('returns 500 on network error', async () => {
      (tmdb.get as jest.Mock).mockRejectedValue(new Error('Network error'));
      const res = await request(app).get('/v1/tv/search?q=lost');
      expect(res.status).toBe(500);
    });
  });
});
