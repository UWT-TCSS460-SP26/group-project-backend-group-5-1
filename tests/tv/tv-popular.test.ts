import request from 'supertest';
import { app } from '../../src/app';
import tmdb from '../../src/config/tmdbClient';

jest.mock('../../src/config/tmdbClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockPopularTvResponse = {
  page: 1,
  results: [
    {
      id: 1396,
      name: 'Breaking Bad',
      poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      first_air_date: '2008-01-20',
    },
    {
      id: 1399,
      name: 'Game of Thrones',
      poster_path: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
      first_air_date: '2011-04-17',
    },
  ],
  total_pages: 1000,
  total_results: 20000,
};

beforeEach(() => {
  (tmdb.get as jest.Mock).mockReset();
});

describe('TV Routes', () => {
  describe('GET /v1/tv/popular', () => {
    it('returns 200 and a list of popular TV shows', async () => {
      (tmdb.get as jest.Mock).mockResolvedValue({ data: mockPopularTvResponse });
      const res = await request(app).get('/v1/tv/popular');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        page: 1,
        totalPages: expect.any(Number),
        totalResults: expect.any(Number),
        results: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            title: expect.any(String),
          }),
        ]),
      });
    });

    it('returns 500 on network error', async () => {
      (tmdb.get as jest.Mock).mockRejectedValue(new Error('Network error'));
      const res = await request(app).get('/v1/tv/popular');
      expect(res.status).toBe(500);
    });
  });
});
