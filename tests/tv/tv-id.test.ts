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

const mockTvDetails = {
  id: 123,
  name: 'Test Show',
  original_name: 'Test Show',
  overview: 'A test show overview.',
  tagline: 'Just a test.',
  first_air_date: '2020-01-01',
  last_air_date: '2023-01-01',
  status: 'Ended',
  type: 'Scripted',
  adult: false,
  genres: [{ id: 18, name: 'Drama' }],
  original_language: 'en',
  spoken_languages: [{ english_name: 'English', iso_639_1: 'en', name: 'English' }],
  origin_country: ['US'],
  number_of_episodes: 30,
  number_of_seasons: 3,
  seasons: [{ id: 1, name: 'Season 1', episode_count: 10, air_date: '2020-01-01' }],
  episode_run_time: [45],
  last_episode_to_air: { id: 1, name: 'Finale', episode_number: 10, season_number: 3 },
  next_episode_to_air: null,
  networks: [{ id: 1, name: 'HBO', logo_path: '/hbo.png', origin_country: 'US' }],
  production_companies: [{ id: 1, name: 'Test Productions', logo_path: null, origin_country: 'US' }],
  production_countries: [{ iso_3166_1: 'US', name: 'United States of America' }],
  created_by: [{ id: 1, name: 'Test Creator', profile_path: null }],
};

describe('GET /v1/tv/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns details when id is provided', async () => {
    (tvService.fetchTmdb as jest.Mock).mockResolvedValue(mockTvDetails);

    const response = await request(app).get('/v1/tv/123');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('overview');
    expect(response.body).toHaveProperty('first_air_date');
    expect(response.body).toHaveProperty('number_of_seasons');
    expect(response.body).toHaveProperty('networks');
    expect(response.body.id).toBeUndefined(); // filtered out by trimByIdFields
  });

  it('returns 400 when id is invalid', async () => {
    const response = await request(app).get('/v1/tv/asbad');
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('TV id must be a positive integer');
  });

  it('returns 404 when id is not found', async () => {
    const notFoundError = Object.assign(new Error('TMDB error: 404 Not Found'), { status: 404 });
    (tvService.fetchTmdb as jest.Mock).mockRejectedValue(notFoundError);

    const response = await request(app).get('/v1/tv/999999');
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('TV show with id 999999 not found');
  });
});
