"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../../src/app");
const prisma_1 = require("../../src/lib/prisma");
const helpers_1 = require("../helpers");
jest.mock('../../src/lib/prisma', () => ({
    prisma: {
        rating: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}));
const mockRating = prisma_1.prisma.rating;
const asUser = (0, helpers_1.authHeader)({ sub: 1, role: 'user' });
const asOtherUser = (0, helpers_1.authHeader)({ sub: 2, role: 'user' });
beforeEach(() => {
    jest.clearAllMocks();
});
describe('POST /v1/ratings', () => {
    it('creates a rating with valid token', async () => {
        mockRating.findFirst.mockResolvedValueOnce(null);
        mockRating.create.mockResolvedValueOnce({
            id: 1,
            mediaId: 120,
            mediaType: 'movie',
            userId: 1,
            score: 8,
        });
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/v1/ratings')
            .set(asUser)
            .send({ mediaId: 120, mediaType: 'movie', score: 8 });
        expect(response.status).toBe(201);
        expect(mockRating.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: 1 }) }));
    });
    it('returns 401 when token is missing', async () => {
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/v1/ratings')
            .send({ mediaId: 120, mediaType: 'movie', score: 8 });
        expect(response.status).toBe(401);
    });
    it('returns 401 with invalid token', async () => {
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/v1/ratings')
            .set({ Authorization: 'Bearer not.a.valid.token' })
            .send({ mediaId: 120, mediaType: 'movie', score: 8 });
        expect(response.status).toBe(401);
    });
    it('returns 400 when mediaId is missing', async () => {
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/v1/ratings')
            .set(asUser)
            .send({ mediaType: 'movie', score: 8 });
        expect(response.status).toBe(400);
    });
    it('returns 400 when score is missing', async () => {
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/v1/ratings')
            .set(asUser)
            .send({ mediaId: 120, mediaType: 'movie' });
        expect(response.status).toBe(400);
    });
    it('returns 409 when rating already exists', async () => {
        mockRating.findFirst.mockResolvedValueOnce({ id: 1 });
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/v1/ratings')
            .set(asUser)
            .send({ mediaId: 120, mediaType: 'movie', score: 8 });
        expect(response.status).toBe(409);
    });
});
describe('GET /v1/ratings/movie/:mediaId', () => {
    it('returns list of ratings for a movie (public)', async () => {
        mockRating.findMany.mockResolvedValueOnce([
            { id: 1, mediaId: 120, mediaType: 'movie', userId: 1, score: 8 },
        ]);
        const response = await (0, supertest_1.default)(app_1.app).get('/v1/ratings/movie/120');
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].mediaId).toBe(120);
        expect(response.body[0].score).toBe(8);
    });
    it('returns empty array when no ratings found', async () => {
        mockRating.findMany.mockResolvedValueOnce([]);
        const response = await (0, supertest_1.default)(app_1.app).get('/v1/ratings/movie/999');
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(0);
    });
});
describe('GET /v1/ratings/movie/:mediaId/:userId', () => {
    it('returns a specific user rating (public)', async () => {
        mockRating.findFirst.mockResolvedValueOnce({
            id: 1,
            mediaId: 120,
            mediaType: 'movie',
            userId: 1,
            score: 8,
        });
        const response = await (0, supertest_1.default)(app_1.app).get('/v1/ratings/movie/120/1');
        expect(response.status).toBe(200);
        expect(response.body.score).toBe(8);
    });
    it('returns 404 if user rating not found', async () => {
        mockRating.findFirst.mockResolvedValueOnce(null);
        const response = await (0, supertest_1.default)(app_1.app).get('/v1/ratings/movie/120/99');
        expect(response.status).toBe(404);
    });
});
describe('PUT /v1/ratings/:id', () => {
    it('updates a rating with valid token', async () => {
        mockRating.findUnique.mockResolvedValueOnce({
            id: 1,
            mediaId: 120,
            userId: 1,
            score: 8,
        });
        mockRating.update.mockResolvedValueOnce({
            id: 1,
            mediaId: 120,
            userId: 1,
            score: 9,
        });
        const response = await (0, supertest_1.default)(app_1.app).put('/v1/ratings/1').set(asUser).send({ score: 9 });
        expect(response.status).toBe(200);
    });
    it('returns 401 when token is missing', async () => {
        const response = await (0, supertest_1.default)(app_1.app).put('/v1/ratings/1').send({ score: 9 });
        expect(response.status).toBe(401);
    });
    it('non-owner gets 403', async () => {
        mockRating.findUnique.mockResolvedValueOnce({
            id: 1,
            mediaId: 120,
            userId: 1,
            score: 8,
        });
        const response = await (0, supertest_1.default)(app_1.app).put('/v1/ratings/1').set(asOtherUser).send({ score: 9 });
        expect(response.status).toBe(403);
    });
    it('returns 404 if rating not found', async () => {
        mockRating.findUnique.mockResolvedValueOnce(null);
        const response = await (0, supertest_1.default)(app_1.app).put('/v1/ratings/1').set(asUser).send({ score: 9 });
        expect(response.status).toBe(404);
    });
});
describe('DELETE /v1/ratings/:id', () => {
    it('deletes a rating with valid token', async () => {
        mockRating.findUnique.mockResolvedValueOnce({
            id: 1,
            mediaId: 120,
            userId: 1,
            score: 8,
        });
        mockRating.delete.mockResolvedValueOnce({ id: 1 });
        const response = await (0, supertest_1.default)(app_1.app).delete('/v1/ratings/1').set(asUser);
        expect(response.status).toBe(204);
    });
    it('returns 401 when token is missing', async () => {
        const response = await (0, supertest_1.default)(app_1.app).delete('/v1/ratings/1');
        expect(response.status).toBe(401);
    });
    it('non-owner gets 403', async () => {
        mockRating.findUnique.mockResolvedValueOnce({
            id: 1,
            mediaId: 120,
            userId: 1,
            score: 8,
        });
        const response = await (0, supertest_1.default)(app_1.app).delete('/v1/ratings/1').set(asOtherUser);
        expect(response.status).toBe(403);
    });
    it('returns 404 if rating not found', async () => {
        mockRating.findUnique.mockResolvedValueOnce(null);
        const response = await (0, supertest_1.default)(app_1.app).delete('/v1/ratings/1').set(asUser);
        expect(response.status).toBe(404);
    });
});
//# sourceMappingURL=movie-ratings.test.js.map