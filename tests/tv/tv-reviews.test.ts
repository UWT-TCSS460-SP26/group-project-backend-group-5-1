import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { authHeader } from '../helpers';

jest.mock('../../src/middleware/resolveLocalUser', () => ({
  resolveLocalUser: jest.fn(
    (
      req: import('express').Request,
      _res: import('express').Response,
      next: import('express').NextFunction
    ) => {
      if (req.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).localUser = { id: Number(req.user.sub) };
      }
      next();
    }
  ),
}));

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
const asUser = authHeader({ sub: 1, role: 'User' });
const asOtherUser = authHeader({ sub: 2, role: 'User' });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /v1/reviews (tv)', () => {
  it('creates a tv review with valid token and auto-links existing rating', async () => {
    (mockReview.findFirst as jest.Mock).mockResolvedValueOnce(null);
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, userId: 1 });
    (mockReview.create as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 1399,
      mediaType: 'tv',
      userId: 1,
      body: 'Great show.',
      ratingId: 1,
    });

    const response = await request(app)
      .post('/v1/reviews')
      .set(asUser)
      .send({ mediaId: 1399, mediaType: 'tv', body: 'Great show.' });

    expect(response.status).toBe(201);
    expect(mockReview.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 1, ratingId: 1 }) })
    );
  });

  it('creates a tv review with ratingId null when no rating exists', async () => {
    (mockReview.findFirst as jest.Mock).mockResolvedValueOnce(null);
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (mockReview.create as jest.Mock).mockResolvedValueOnce({
      id: 2,
      mediaId: 1399,
      mediaType: 'tv',
      userId: 1,
      body: 'Great show.',
      ratingId: null,
    });

    const response = await request(app)
      .post('/v1/reviews')
      .set(asUser)
      .send({ mediaId: 1399, mediaType: 'tv', body: 'Great show.' });

    expect(response.status).toBe(201);
    expect(mockReview.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ ratingId: null }) })
    );
  });

  it('returns 401 when token is missing', async () => {
    const response = await request(app)
      .post('/v1/reviews')
      .send({ mediaId: 1399, mediaType: 'tv', body: 'Great show.' });
    expect(response.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const response = await request(app)
      .post('/v1/reviews')
      .set({ Authorization: 'Bearer not.a.valid.token' })
      .send({ mediaId: 1399, mediaType: 'tv', body: 'Great show.' });
    expect(response.status).toBe(401);
  });

  it('returns 400 when mediaId is missing', async () => {
    const response = await request(app)
      .post('/v1/reviews')
      .set(asUser)
      .send({ mediaType: 'tv', body: 'Great show.' });
    expect(response.status).toBe(400);
  });

  it('returns 400 when body is missing', async () => {
    const response = await request(app)
      .post('/v1/reviews')
      .set(asUser)
      .send({ mediaId: 1399, mediaType: 'tv' });
    expect(response.status).toBe(400);
  });

  it('returns 409 when review already exists', async () => {
    (mockReview.findFirst as jest.Mock).mockResolvedValueOnce({ id: 1 });
    const response = await request(app)
      .post('/v1/reviews')
      .set(asUser)
      .send({ mediaId: 1399, mediaType: 'tv', body: 'Great show.' });
    expect(response.status).toBe(409);
  });
});

describe('GET /v1/reviews/tv/:mediaId', () => {
  it('returns list of reviews for a tv show (public)', async () => {
    (mockReview.findMany as jest.Mock).mockResolvedValueOnce([
      { id: 1, mediaId: 1399, mediaType: 'tv', userId: 1, body: 'Great show.' },
    ]);
    const response = await request(app).get('/v1/reviews/tv/1399');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].mediaId).toBe(1399);
  });

  it('returns empty array when no reviews found', async () => {
    (mockReview.findMany as jest.Mock).mockResolvedValueOnce([]);
    const response = await request(app).get('/v1/reviews/tv/999');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(0);
  });
});

describe('GET /v1/reviews/tv/:mediaId/:userId', () => {
  it('returns a specific user review (public)', async () => {
    (mockReview.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 1399,
      mediaType: 'tv',
      userId: 1,
      body: 'Great show.',
    });
    const response = await request(app).get('/v1/reviews/tv/1399/1');
    expect(response.status).toBe(200);
    expect(response.body.body).toBe('Great show.');
  });

  it('returns 404 if user review not found', async () => {
    (mockReview.findFirst as jest.Mock).mockResolvedValueOnce(null);
    const response = await request(app).get('/v1/reviews/tv/1399/99');
    expect(response.status).toBe(404);
  });
});

describe('PUT /v1/reviews/:id (tv)', () => {
  it('updates a tv review with valid token', async () => {
    (mockReview.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 1399,
      userId: 1,
      body: 'Great show.',
    });
    (mockReview.update as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 1399,
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
      mediaId: 1399,
      userId: 1,
      body: 'Great show.',
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

describe('DELETE /v1/reviews/:id (tv)', () => {
  it('deletes a tv review with valid token', async () => {
    (mockReview.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 1399,
      userId: 1,
      body: 'Great show.',
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
      mediaId: 1399,
      userId: 1,
      body: 'Great show.',
    });
    const response = await request(app).delete('/v1/reviews/1').set(asOtherUser);
    expect(response.status).toBe(403);
  });

  it('returns 404 if review not found', async () => {
    (mockReview.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const response = await request(app).delete('/v1/reviews/1').set(asUser);
    expect(response.status).toBe(404);
  });

  it("Admin can delete another user's review", async () => {
    (mockReview.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 1399,
      userId: 99,
      body: 'Someone else wrote this.',
    });
    (mockReview.delete as jest.Mock).mockResolvedValueOnce({ id: 1 });

    const res = await request(app)
      .delete('/v1/reviews/1')
      .set(authHeader({ sub: 1, role: 'Admin' }));

    expect(res.status).toBe(204);
  });

  it("Moderator cannot delete another user's review", async () => {
    (mockReview.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 1399,
      userId: 99,
      body: 'Someone else wrote this.',
    });

    const res = await request(app)
      .delete('/v1/reviews/1')
      .set(authHeader({ sub: 1, role: 'Moderator' }));

    expect(res.status).toBe(403);
  });
});
