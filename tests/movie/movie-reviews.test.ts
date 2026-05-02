import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { authHeader } from '../helpers';

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

const mockReview = prisma.review as jest.Mocked<typeof prisma.review>;
const mockRating = prisma.rating as jest.Mocked<typeof prisma.rating>;
const asUser = authHeader({ sub: 'user-1', role: 'User' });
const asOtherUser = authHeader({ sub: 'user-2', role: 'User' });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /v1/reviews', () => {
  it('creates a review with valid token', async () => {
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, userId: 1 });
    (mockReview.findFirst as jest.Mock).mockResolvedValueOnce(null);
    (mockReview.create as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 550,
      mediaType: 'movie',
      userId: 1,
      body: 'Great movie.',
      ratingId: 1,
    });

    const response = await request(app)
      .post('/v1/reviews')
      .set(asUser)
      .send({ mediaId: 550, mediaType: 'movie', body: 'Great movie.', ratingId: 1 });

    expect(response.status).toBe(201);
    expect(mockReview.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 1 }) })
    );
  });

  it('returns 401 when token is missing', async () => {
    const response = await request(app)
      .post('/v1/reviews')
      .send({ mediaId: 550, mediaType: 'movie', body: 'Great movie.', ratingId: 1 });
    expect(response.status).toBe(401);
  });

  it('returns 400 when mediaId is missing', async () => {
    const response = await request(app)
      .post('/v1/reviews')
      .set(asUser)
      .send({ mediaType: 'movie', body: 'Great movie.', ratingId: 1 });
    expect(response.status).toBe(400);
  });

  it('returns 400 when body is missing', async () => {
    const response = await request(app)
      .post('/v1/reviews')
      .set(asUser)
      .send({ mediaId: 550, mediaType: 'movie', ratingId: 1 });
    expect(response.status).toBe(400);
  });

  it('returns 404 when rating not found', async () => {
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const response = await request(app)
      .post('/v1/reviews')
      .set(asUser)
      .send({ mediaId: 550, mediaType: 'movie', body: 'Great movie.', ratingId: 999 });
    expect(response.status).toBe(404);
  });

  it('returns 409 when review already exists', async () => {
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, userId: 1 });
    (mockReview.findFirst as jest.Mock).mockResolvedValueOnce({ id: 1 });
    const response = await request(app)
      .post('/v1/reviews')
      .set(asUser)
      .send({ mediaId: 550, mediaType: 'movie', body: 'Great movie.', ratingId: 1 });
    expect(response.status).toBe(409);
  });
});

describe('GET /v1/reviews/movie/:mediaId', () => {
  it('returns list of reviews for a movie (public)', async () => {
    (mockReview.findMany as jest.Mock).mockResolvedValueOnce([
      { id: 1, mediaId: 550, mediaType: 'movie', userId: 1, body: 'Great movie.' },
    ]);
    const response = await request(app).get('/v1/reviews/movie/550');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].mediaId).toBe(550);
  });

  it('returns empty array when no reviews found', async () => {
    (mockReview.findMany as jest.Mock).mockResolvedValueOnce([]);
    const response = await request(app).get('/v1/reviews/movie/999');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(0);
  });
});

describe('GET /v1/reviews/movie/:mediaId/:userId', () => {
  it('returns a specific user review (public)', async () => {
    (mockReview.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 550,
      mediaType: 'movie',
      userId: 1,
      body: 'Great movie.',
    });
    const response = await request(app).get('/v1/reviews/movie/550/1');
    expect(response.status).toBe(200);
    expect(response.body.body).toBe('Great movie.');
  });

  it('returns 404 if user review not found', async () => {
    (mockReview.findFirst as jest.Mock).mockResolvedValueOnce(null);
    const response = await request(app).get('/v1/reviews/movie/550/99');
    expect(response.status).toBe(404);
  });
});

describe('PUT /v1/reviews/:id', () => {
  it('updates a review with valid token', async () => {
    (mockReview.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 550,
      userId: 1,
      body: 'Great movie.',
    });
    (mockReview.update as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 550,
      userId: 1,
      body: 'Even better.',
    });
    const response = await request(app)
      .put('/v1/reviews/1')
      .set(asUser)
      .send({ body: 'Even better.' });
    expect(response.status).toBe(200);
  });

  it('returns 401 when token is missing', async () => {
    const response = await request(app).put('/v1/reviews/1').send({ body: 'Even better.' });
    expect(response.status).toBe(401);
  });

  it('non-owner gets 403', async () => {
    (mockReview.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 550,
      userId: 1,
      body: 'Great movie.',
    });
    const response = await request(app)
      .put('/v1/reviews/1')
      .set(asOtherUser)
      .send({ body: 'Even better.' });
    expect(response.status).toBe(403);
  });

  it('returns 404 if review not found', async () => {
    (mockReview.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const response = await request(app)
      .put('/v1/reviews/1')
      .set(asUser)
      .send({ body: 'Even better.' });
    expect(response.status).toBe(404);
  });
});

describe('DELETE /v1/reviews/:id', () => {
  it('deletes a review with valid token', async () => {
    (mockReview.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 550,
      userId: 1,
      body: 'Great movie.',
    });
    (mockReview.delete as jest.Mock).mockResolvedValueOnce({ id: 1 });
    const response = await request(app).delete('/v1/reviews/1').set(asUser);
    expect(response.status).toBe(204);
  });

  it('returns 401 when token is missing', async () => {
    const response = await request(app).delete('/v1/reviews/1');
    expect(response.status).toBe(401);
  });

  it('non-owner gets 403', async () => {
    (mockReview.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 550,
      userId: 1,
      body: 'Great movie.',
    });
    const response = await request(app).delete('/v1/reviews/1').set(asOtherUser);
    expect(response.status).toBe(403);
  });

  it('returns 404 if review not found', async () => {
    (mockReview.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const response = await request(app).delete('/v1/reviews/1').set(asUser);
    expect(response.status).toBe(404);
  });
});