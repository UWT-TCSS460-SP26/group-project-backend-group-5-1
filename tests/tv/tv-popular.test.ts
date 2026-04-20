import request from 'supertest';
import { app } from '../../src/app';
import * as tvService from '../../src/services/tv';

jest.mock('../../src/services/tv', () => ({
  ...jest.requireActual('../../src/services/tv'),
  fetchTmdb: jest.fn(),
  fetchTvPage: jest.fn(),
  parseTvQuery: jest.requireActual('../../src/services/tv').parseTvQuery,
  TMDB_PAGE_SIZE: 20,
}));

const mockPopularTvResults = [
  {
    id: 1,
    name: 'Popular Show 1',
    poster_path: '/poster1.jpg',
    backdrop_path: '/backdrop1.jpg',
  },
  {
    id: 2,
    name: 'Popular Show 2',
    poster_path: '/poster2.jpg',
    backdrop_path: '/backdrop2.jpg',
  },
];

describe('GET /v1/tv/popular', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (tvService.fetchTvPage as jest.Mock).mockResolvedValue(mockPopularTvResults);
  });

  it('returns a list of popular TV shows', async () => {
    const response = await request(app).get('/v1/tv/popular');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('name');
    expect(response.body[0]).toHaveProperty('poster_path');
    expect(response.body[0]).toHaveProperty('backdrop_path');
  });

  it('respects the limit parameter', async () => {
    const response = await request(app).get('/v1/tv/popular?limit=1');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeLessThanOrEqual(1);
  });

  it('returns 400 when limit is invalid', async () => {
    const response = await request(app).get('/v1/tv/popular?limit=abc');
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('limit must be a positive integer');
  });

  it('returns 400 when limit exceeds maximum', async () => {
    const response = await request(app).get('/v1/tv/popular?limit=999');
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('limit must not exceed 50');
  });

  it('returns 500 when TMDB API fails', async () => {
    (tvService.fetchTvPage as jest.Mock).mockRejectedValue(
      new Error('TMDB error: 500 Internal Server Error')
    );

    const response = await request(app).get('/v1/tv/popular');
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });
});
