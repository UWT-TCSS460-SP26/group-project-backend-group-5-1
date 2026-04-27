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
        tvService.fetchTvPage.mockResolvedValue(mockPopularTvResults);
    });
    it('returns a list of popular TV shows', async () => {
        const response = await (0, supertest_1.default)(app_1.app).get('/v1/tv/popular');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('poster_path');
        expect(response.body[0]).toHaveProperty('backdrop_path');
    });
    it('respects the limit parameter', async () => {
        const response = await (0, supertest_1.default)(app_1.app).get('/v1/tv/popular?limit=1');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeLessThanOrEqual(1);
    });
    it('returns 400 when limit is invalid', async () => {
        const response = await (0, supertest_1.default)(app_1.app).get('/v1/tv/popular?limit=abc');
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('limit must be a positive integer');
    });
    it('returns 400 when limit exceeds maximum', async () => {
        const response = await (0, supertest_1.default)(app_1.app).get('/v1/tv/popular?limit=999');
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('limit must not exceed 50');
    });
    it('returns 500 when TMDB API fails', async () => {
        tvService.fetchTvPage.mockRejectedValue(new Error('TMDB error: 500 Internal Server Error'));
        const response = await (0, supertest_1.default)(app_1.app).get('/v1/tv/popular');
        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');
    });
});
//# sourceMappingURL=tv-popular.test.js.map