import request from 'supertest';
import { app } from '../../src/app';
import * as tvService from '../../src/services/tv';

jest.mock('../../src/services/tv', () => ({
  ...jest.requireActual('../../src/services/tv'),
  fetchTvPage: jest.fn(),
  fetchTmdb: jest.fn(),
  parseTvQuery: jest.requireActual('../../src/services/tv').parseTvQuery,
  TMDB_PAGE_SIZE: 20,
}));

const mockTvResults = [
  {
    id: 1,
    name: 'Test Show',
    poster_path: '/test.jpg',
    backdrop_path: '/backdrop.jpg',
  },
];

describe('GET /v1/tv', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (tvService.fetchTvPage as jest.Mock).mockResolvedValue(mockTvResults);
  });

  it('returns results when q is provided', async () => {
    const response = await request(app).get('/v1/tv?query=test');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('name');
    // todo: add more assertions based on the expected response structure
  });

  it('returns 404 when tv show is not found', async () => {
    const notFoundError = Object.assign(new Error('TMDB error: 404 Not Found'), { status: 404 });
    (tvService.fetchTmdb as jest.Mock).mockRejectedValue(notFoundError);

    const response = await request(app).get('/v1/tv/99999');
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
});
