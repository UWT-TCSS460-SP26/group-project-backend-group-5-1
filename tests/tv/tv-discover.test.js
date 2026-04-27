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
        tvService.fetchTvPage.mockResolvedValue(mockTvResults);
    });
    it('returns results when q is provided', async () => {
        const response = await (0, supertest_1.default)(app_1.app).get('/v1/tv?query=test');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        // todo: add more assertions based on the expected response structure
    });
    it('returns 404 when tv show is not found', async () => {
        const notFoundError = Object.assign(new Error('TMDB error: 404 Not Found'), { status: 404 });
        tvService.fetchTmdb.mockRejectedValue(notFoundError);
        const response = await (0, supertest_1.default)(app_1.app).get('/v1/tv/99999');
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
    });
});
//# sourceMappingURL=tv-discover.test.js.map