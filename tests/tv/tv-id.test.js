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
const tvService = __importStar(require("../../src/services/tv"));
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
    production_companies: [
        { id: 1, name: 'Test Productions', logo_path: null, origin_country: 'US' },
    ],
    production_countries: [{ iso_3166_1: 'US', name: 'United States of America' }],
    created_by: [{ id: 1, name: 'Test Creator', profile_path: null }],
};
describe('GET /v1/tv/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('returns details when id is provided', async () => {
        tvService.fetchTmdb.mockResolvedValue(mockTvDetails);
        const response = await (0, supertest_1.default)(app_1.app).get('/v1/tv/123');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('overview');
        expect(response.body).toHaveProperty('first_air_date');
        expect(response.body).toHaveProperty('number_of_seasons');
        expect(response.body).toHaveProperty('networks');
        expect(response.body.id).toBeUndefined(); // filtered out by trimByIdFields
    });
    it('returns 400 when id is invalid', async () => {
        const response = await (0, supertest_1.default)(app_1.app).get('/v1/tv/asbad');
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('TV id must be a positive integer');
    });
    it('returns 404 when id is not found', async () => {
        const notFoundError = Object.assign(new Error('TMDB error: 404 Not Found'), { status: 404 });
        tvService.fetchTmdb.mockRejectedValue(notFoundError);
        const response = await (0, supertest_1.default)(app_1.app).get('/v1/tv/999999');
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('TV show with id 999999 not found');
    });
});
//# sourceMappingURL=tv-id.test.js.map