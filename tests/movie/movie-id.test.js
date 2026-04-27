"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../../src/app");
const movieService = __importStar(require("../../src/services/movies"));
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
        movieService.fetchTmdb.mockResolvedValue(mockMovieResponse);
        const res = await (0, supertest_1.default)(app_1.app).get('/v1/movies/11');
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
        movieService.fetchTmdb.mockResolvedValue(mockMovieResponse);
        const res = await (0, supertest_1.default)(app_1.app).get('/v1/movies/11');
        expect(res.status).toBe(200);
        expect(res.body).not.toHaveProperty('popularity');
        expect(res.body).not.toHaveProperty('vote_average');
        expect(res.body).not.toHaveProperty('vote_count');
        expect(res.body).not.toHaveProperty('id');
    });
    it('returns 400 when id is invalid', async () => {
        const res = await (0, supertest_1.default)(app_1.app).get('/v1/movies/abc');
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toBe('Movie id must be a positive integer');
    });
    it('returns 404 when movie is not found', async () => {
        const notFoundError = Object.assign(new Error('TMDB error: 404 Not Found'), { status: 404 });
        movieService.fetchTmdb.mockRejectedValue(notFoundError);
        const res = await (0, supertest_1.default)(app_1.app).get('/v1/movies/999999');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toBe('Movie with id 999999 not found');
    });
    it('returns 500 on fetch error', async () => {
        movieService.fetchTmdb.mockRejectedValue(new Error('Network error'));
        const res = await (0, supertest_1.default)(app_1.app).get('/v1/movies/11');
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error');
    });
});
//# sourceMappingURL=movie-id.test.js.map