import request from 'supertest';
import { app } from '../../src/app';
import tmdb from '../../src/config/tmdbClient';
import axios, { AxiosResponse } from 'axios';

jest.mock('../../src/config/tmdbClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockTvDetailsResponse = {
  id: 4607,
  name: 'Lost',
  poster_path: '/og65OaTZU6YUJAbqxeKjCa3kY1E.jpg',
  overview:
    'Survivors of a plane crash are forced to work together in order to survive on a seemingly deserted tropical island.',
  first_air_date: '2004-09-22',
  genres: [
    { id: 18, name: 'Drama' },
    { id: 9648, name: 'Mystery' },
  ],
  status: 'Ended',
  number_of_seasons: 6,
  number_of_episodes: 121,
  networks: [{ id: 2, name: 'ABC' }],
};

beforeEach(() => {
  (tmdb.get as jest.Mock).mockReset();
});

describe('TV Routes', () => {
  describe('GET /v1/tv/:id', () => {
    it('returns 200 and details when id is provided', async () => {
      (tmdb.get as jest.Mock).mockResolvedValue({ data: mockTvDetailsResponse });
      const res = await request(app).get('/v1/tv/4607');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: expect.any(Number),
        title: expect.any(String),
        genres: expect.arrayContaining([expect.any(String)]),
        networks: expect.arrayContaining([expect.any(String)]),
      });
    });

    it('returns 404 when id is not found', async () => {
      const error = new axios.AxiosError('Not found');
      error.response = {
        status: 404,
        data: { message: 'tv show not found' },
      } as AxiosResponse;
      (tmdb.get as jest.Mock).mockRejectedValue(error);
      const res = await request(app).get('/v1/tv/999999');
      expect(res.status).toBe(404);
    });

    it('returns 500 on network error', async () => {
      (tmdb.get as jest.Mock).mockRejectedValue(new Error('Network error'));
      const res = await request(app).get('/v1/tv/4607');
      expect(res.status).toBe(500);
    });
  });
});
