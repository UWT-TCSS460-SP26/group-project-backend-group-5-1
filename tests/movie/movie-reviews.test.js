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
        rating: { findUnique: jest.fn() },
        review: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}));
const mockReview = prisma_1.prisma.review;
const mockRating = prisma_1.prisma.rating;
const asUser = (0, helpers_1.authHeader)({ sub: 1, role: 'user' });
const asOtherUser = (0, helpers_1.authHeader)({ sub: 2, role: 'user' });
beforeEach(() => {
    jest.clearAllMocks();
});
describe('POST /v1/reviews', () => {
    it('creates a review with valid token', async () => {
        mockRating.findUnique.mockResolvedValueOnce({ id: 1, userId: 1 });
        mockReview.findFirst.mockResolvedValueOnce(null);
        mockReview.create.mockResolvedValueOnce({
            id: 1,
            mediaId: 550,
            mediaType: 'movie',
            userId: 1,
            body: 'Great movie.',
            ratingId: 1,
        });
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/v1/reviews')
            .set(asUser)
            .send({ mediaId: 550, mediaType: 'movie', body: 'Great movie.', ratingId: 1 });
        expect(response.status).toBe(201);
        expect(mockReview.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: 1 }) }));
    });
    it('returns 401 when token is missing', async () => {
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/v1/reviews')
            .send({ mediaId: 550, mediaType: 'movie', body: 'Great movie.', ratingId: 1 });
        expect(response.status).toBe(401);
    });
    it('returns 401 with invalid token', async () => {
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/v1/reviews')
            .set({ Authorization: 'Bearer not.a.valid.token' })
            .send({ mediaId: 550, mediaType: 'movie', body: 'Great movie.', ratingId: 1 });
        expect(response.status).toBe(401);
    });
    it('returns 400 when mediaId is missing', async () => {
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/v1/reviews')
            .set(asUser)
            .send({ mediaType: 'movie', body: 'Great movie.', ratingId: 1 });
        expect(response.status).toBe(400);
    });
    it('returns 400 when body is missing', async () => {
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/v1/reviews')
            .set(asUser)
            .send({ mediaId: 550, mediaType: 'movie', ratingId: 1 });
        expect(response.status).toBe(400);
    });
    it('returns 404 when rating not found', async () => {
        mockRating.findUnique.mockResolvedValueOnce(null);
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/v1/reviews')
            .set(asUser)
            .send({ mediaId: 550, mediaType: 'movie', body: 'Great movie.', ratingId: 999 });
        expect(response.status).toBe(404);
    });
    it('returns 409 when review already exists', async () => {
        mockRating.findUnique.mockResolvedValueOnce({ id: 1, userId: 1 });
        mockReview.findFirst.mockResolvedValueOnce({ id: 1 });
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/v1/reviews')
            .set(asUser)
            .send({ mediaId: 550, mediaType: 'movie', body: 'Great movie.', ratingId: 1 });
        expect(response.status).toBe(409);
    });
});
describe('GET /v1/reviews/movie/:mediaId', () => {
    it('returns list of reviews for a movie (public)', async () => {
        mockReview.findMany.mockResolvedValueOnce([
            { id: 1, mediaId: 550, mediaType: 'movie', userId: 1, body: 'Great movie.' },
        ]);
        const response = await (0, supertest_1.default)(app_1.app).get('/v1/reviews/movie/550');
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].mediaId).toBe(550);
    });
    it('returns empty array when no reviews found', async () => {
        mockReview.findMany.mockResolvedValueOnce([]);
        const response = await (0, supertest_1.default)(app_1.app).get('/v1/reviews/movie/999');
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(0);
    });
});
describe('GET /v1/reviews/movie/:mediaId/:userId', () => {
    it('returns a specific user review (public)', async () => {
        mockReview.findFirst.mockResolvedValueOnce({
            id: 1,
            mediaId: 550,
            mediaType: 'movie',
            userId: 1,
            body: 'Great movie.',
        });
        const response = await (0, supertest_1.default)(app_1.app).get('/v1/reviews/movie/550/1');
        expect(response.status).toBe(200);
        expect(response.body.body).toBe('Great movie.');
    });
    it('returns 404 if user review not found', async () => {
        mockReview.findFirst.mockResolvedValueOnce(null);
        const response = await (0, supertest_1.default)(app_1.app).get('/v1/reviews/movie/550/99');
        expect(response.status).toBe(404);
    });
});
describe('PUT /v1/reviews/:id', () => {
    it('updates a review with valid token', async () => {
        mockReview.findUnique.mockResolvedValueOnce({
            id: 1,
            mediaId: 550,
            userId: 1,
            body: 'Great movie.',
        });
        mockReview.update.mockResolvedValueOnce({
            id: 1,
            mediaId: 550,
            userId: 1,
            body: 'Even better.',
        });
        const response = await (0, supertest_1.default)(app_1.app)
            .put('/v1/reviews/1')
            .set(asUser)
            .send({ body: 'Even better.' });
        expect(response.status).toBe(200);
    });
    it('returns 401 when token is missing', async () => {
        const response = await (0, supertest_1.default)(app_1.app).put('/v1/reviews/1').send({ body: 'Even better.' });
        expect(response.status).toBe(401);
    });
    it('non-owner gets 403', async () => {
        mockReview.findUnique.mockResolvedValueOnce({
            id: 1,
            mediaId: 550,
            userId: 1,
            body: 'Great movie.',
        });
        const response = await (0, supertest_1.default)(app_1.app)
            .put('/v1/reviews/1')
            .set(asOtherUser)
            .send({ body: 'Even better.' });
        expect(response.status).toBe(403);
    });
    it('returns 404 if review not found', async () => {
        mockReview.findUnique.mockResolvedValueOnce(null);
        const response = await (0, supertest_1.default)(app_1.app)
            .put('/v1/reviews/1')
            .set(asUser)
            .send({ body: 'Even better.' });
        expect(response.status).toBe(404);
    });
});
describe('DELETE /v1/reviews/:id', () => {
    it('deletes a review with valid token', async () => {
        mockReview.findUnique.mockResolvedValueOnce({
            id: 1,
            mediaId: 550,
            userId: 1,
            body: 'Great movie.',
        });
        mockReview.delete.mockResolvedValueOnce({ id: 1 });
        const response = await (0, supertest_1.default)(app_1.app).delete('/v1/reviews/1').set(asUser);
        expect(response.status).toBe(204);
    });
    it('returns 401 when token is missing', async () => {
        const response = await (0, supertest_1.default)(app_1.app).delete('/v1/reviews/1');
        expect(response.status).toBe(401);
    });
    it('non-owner gets 403', async () => {
        mockReview.findUnique.mockResolvedValueOnce({
            id: 1,
            mediaId: 550,
            userId: 1,
            body: 'Great movie.',
        });
        const response = await (0, supertest_1.default)(app_1.app).delete('/v1/reviews/1').set(asOtherUser);
        expect(response.status).toBe(403);
    });
    it('returns 404 if review not found', async () => {
        mockReview.findUnique.mockResolvedValueOnce(null);
        const response = await (0, supertest_1.default)(app_1.app).delete('/v1/reviews/1').set(asUser);
        expect(response.status).toBe(404);
    });
});
//# sourceMappingURL=movie-reviews.test.js.map