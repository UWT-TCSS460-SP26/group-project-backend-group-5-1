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
    fetchMoviePage: jest.fn(),
    fetchTmdb: jest.fn(),
    parseMovieQuery: jest.requireActual('../../src/services/movies').parseMovieQuery,
    TMDB_PAGE_SIZE: 20,
}));
const mockMovieResults = [
    {
        backdrop_path: '/9Z2uDYXqJrlmePznQQJhL6d92Rq.jpg',
        id: 1226863,
        title: 'The Super Mario Galaxy Movie',
        poster_path: '/eJGWx219ZcEMVQJhAgMiqo8tYY.jpg',
    },
    {
        backdrop_path: '/1x9e0qWonw634NhIsRdvnneeqvN.jpg',
        id: 1523145,
        title: 'Your Heart Will Be Broken',
        poster_path: '/7wIBfBl2gejt6xHxNSK0reVIm7E.jpg',
    },
    {
        backdrop_path: '/u8DU5fkLoM5tTRukzPC31oGPxaQ.jpg',
        id: 83533,
        title: 'Avatar: Fire and Ash',
        poster_path: '/aabwWZWx6z1aYP4PX2ADvbDKktd.jpg',
    },
];
describe('Movie Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        movieService.fetchMoviePage.mockResolvedValue(mockMovieResults);
    });
    describe('GET /v1/movies', () => {
        it('returns 200 and correct fields on success', async () => {
            const res = await (0, supertest_1.default)(app_1.app).get('/v1/movies?with_genres=28');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('title');
            expect(res.body[0]).toHaveProperty('poster_path');
            expect(res.body[0]).toHaveProperty('backdrop_path');
        });
        it('strips fields not in the allowlist', async () => {
            const res = await (0, supertest_1.default)(app_1.app).get('/v1/movies?with_genres=28');
            expect(res.status).toBe(200);
            expect(res.body[0]).not.toHaveProperty('adult');
            expect(res.body[0]).not.toHaveProperty('popularity');
            expect(res.body[0]).not.toHaveProperty('vote_average');
            expect(res.body[0]).not.toHaveProperty('vote_count');
            expect(res.body[0]).not.toHaveProperty('genre_ids');
            expect(res.body[0]).not.toHaveProperty('original_language');
        });
        it('respects the limit parameter', async () => {
            const manyResults = Array.from({ length: 20 }, (_, i) => ({
                ...mockMovieResults[0],
                id: i + 1,
                title: `Movie ${i + 1}`,
            }));
            movieService.fetchMoviePage.mockResolvedValue(manyResults);
            const res = await (0, supertest_1.default)(app_1.app).get('/v1/movies?limit=3');
            expect(res.status).toBe(200);
            expect(res.body.length).toBeLessThanOrEqual(3);
        });
        it('returns 400 when limit is not a number', async () => {
            const res = await (0, supertest_1.default)(app_1.app).get('/v1/movies?limit=abc');
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
            expect(res.body.error).toBe('limit must be a positive integer');
        });
        it('returns 400 when limit exceeds maximum', async () => {
            const res = await (0, supertest_1.default)(app_1.app).get('/v1/movies?limit=999');
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
            expect(res.body.error).toBe('limit must not exceed 50');
        });
        it('returns 500 on fetch error', async () => {
            movieService.fetchMoviePage.mockRejectedValue(new Error('Network error'));
            const res = await (0, supertest_1.default)(app_1.app).get('/v1/movies?with_genres=28');
            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('error');
        });
    });
});
//# sourceMappingURL=movie-discover.test.js.map