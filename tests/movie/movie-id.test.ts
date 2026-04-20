import request from 'supertest';
import { app } from '../../src/app';
import * as movieService from '../../src/services/movies';

jest.mock('../../src/services/movies', () => ({
  ...jest.requireActual('../../src/services/movies'),
  fetchTmdb: jest.fn(),
  fetchMoviePage: jest.fn(),
  parseMovieQuery: jest.requireActual('../../src/services/movies').parseMovieQuery,
  TMDB_PAGE_SIZE: 20,
}));

const mockMovieResponse = {
  title: 'Star Wars',
  original_title: 'Star Wars',
  overview: 'Princess Leia...',
  tagline: 'A long time ago in a galaxy far, far away....',
  runtime: 121,
  release_date: '1977-05-25',
  status: 'Released',
  adult: false,
  genre_ids: [12],
  genres: [{ id: 12, name: 'Adventure' }],
  original_language: 'en',
  spoken_languages: [{ english_name: 'English', iso_639_1: 'en', name: 'English' }],
  budget: 11000000,
  revenue: 775398007,
  poster_path: '/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg',
  backdrop_path: '/2w4xG178RpB4MDAIfTkqAuSJzec.jpg',
  imdb_id: 'tt0076759',
  production_companies: [
    { id: 1, logo_path: '/logo.png', name: 'Lucasfilm Ltd.', origin_country: 'US' },
  ],
  production_countries: [{ iso_3166_1: 'US', name: 'United States of America' }],
  belongs_to_collection: {
    id: 10,
    name: 'Star Wars Collection',
    poster_path: '/iTQHKziZy29ocjNhNlY4mBC2rjA.jpg',
    backdrop_path: '/d8duYyyC9J5T825Hg7grmaabfxQ.jpg',
  },
};

describe('GET /v1/movies/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 and correct fields on success', async () => {
    (movieService.fetchTmdb as jest.Mock).mockResolvedValue(mockMovieResponse);

    const res = await request(app).get('/v1/movies/11');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('overview');
    expect(res.body).toHaveProperty('runtime');
    expect(res.body).toHaveProperty('release_date');
    expect(res.body).toHaveProperty('genres');
    expect(res.body).toHaveProperty('budget');
    expect(res.body).toHaveProperty('revenue');
    expect(res.body).toHaveProperty('belongs_to_collection');
    expect(res.body).toHaveProperty('production_companies');
    expect(res.body).toHaveProperty('imdb_id');
  });

  it('strips fields not in the allowlist', async () => {
    (movieService.fetchTmdb as jest.Mock).mockResolvedValue(mockMovieResponse);

    const res = await request(app).get('/v1/movies/11');
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('popularity');
    expect(res.body).not.toHaveProperty('vote_average');
    expect(res.body).not.toHaveProperty('vote_count');
    expect(res.body).not.toHaveProperty('id');
  });

  it('returns 400 when id is invalid', async () => {
    const res = await request(app).get('/v1/movies/abc');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toBe('Movie id must be a positive integer');
  });

  it('returns 404 when movie is not found', async () => {
    const notFoundError = Object.assign(new Error('TMDB error: 404 Not Found'), { status: 404 });
    (movieService.fetchTmdb as jest.Mock).mockRejectedValue(notFoundError);

    const res = await request(app).get('/v1/movies/999999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toBe('Movie with id 999999 not found');
  });

  it('returns 500 on fetch error', async () => {
    (movieService.fetchTmdb as jest.Mock).mockRejectedValue(new Error('Network error'));

    const res = await request(app).get('/v1/movies/11');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});
