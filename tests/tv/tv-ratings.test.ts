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
    rating: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    review: {
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

const mockRating = prisma.rating as jest.Mocked<typeof prisma.rating>;
const mockReview = prisma.review as jest.Mocked<typeof prisma.review>;
const asUser = authHeader({ sub: 1, role: 'User' });
const asOtherUser = authHeader({ sub: 2, role: 'User' });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /v1/ratings (tv)', () => {
  it('creates a tv rating with valid token', async () => {
    (mockRating.findFirst as jest.Mock).mockResolvedValueOnce(null);
    (mockRating.create as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 1399,
      mediaType: 'tv',
      userId: 1,
      score: 9,
    });
    (mockReview.findFirst as jest.Mock).mockResolvedValueOnce(null);

    const response = await request(app)
      .post('/v1/ratings')
      .set(asUser)
      .send({ mediaId: 1399, mediaType: 'tv', score: 9 });

    expect(response.status).toBe(201);
    expect(mockRating.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 1 }) })
    );
  });

  it('returns 401 when token is missing', async () => {
    const response = await request(app)
      .post('/v1/ratings')
      .send({ mediaId: 1399, mediaType: 'tv', score: 9 });
    expect(response.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const response = await request(app)
      .post('/v1/ratings')
      .set({ Authorization: 'Bearer not.a.valid.token' })
      .send({ mediaId: 1399, mediaType: 'tv', score: 9 });
    expect(response.status).toBe(401);
  });

  it('returns 400 when mediaId is missing', async () => {
    const response = await request(app)
      .post('/v1/ratings')
      .set(asUser)
      .send({ mediaType: 'tv', score: 9 });
    expect(response.status).toBe(400);
  });

  it('returns 400 when score is missing', async () => {
    const response = await request(app)
      .post('/v1/ratings')
      .set(asUser)
      .send({ mediaId: 1399, mediaType: 'tv' });
    expect(response.status).toBe(400);
  });

  it('returns 409 when rating already exists', async () => {
    (mockRating.findFirst as jest.Mock).mockResolvedValueOnce({ id: 1 });
    const response = await request(app)
      .post('/v1/ratings')
      .set(asUser)
      .send({ mediaId: 1399, mediaType: 'tv', score: 9 });
    expect(response.status).toBe(409);
  });
});

describe('GET /v1/ratings/tv/:mediaId', () => {
  it('returns list of ratings for a tv show (public)', async () => {
    (mockRating.findMany as jest.Mock).mockResolvedValueOnce([
      { id: 1, mediaId: 1399, mediaType: 'tv', userId: 1, score: 9 },
    ]);
    const response = await request(app).get('/v1/ratings/tv/1399');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].mediaId).toBe(1399);
    expect(response.body[0].score).toBe(9);
  });

  it('returns empty array when no ratings found', async () => {
    (mockRating.findMany as jest.Mock).mockResolvedValueOnce([]);
    const response = await request(app).get('/v1/ratings/tv/999');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(0);
  });
});

describe('GET /v1/ratings/tv/:mediaId/:userId', () => {
  it('returns a specific user rating (public)', async () => {
    (mockRating.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 1399,
      mediaType: 'tv',
      userId: 1,
      score: 9,
    });
    const response = await request(app).get('/v1/ratings/tv/1399/1');
    expect(response.status).toBe(200);
    expect(response.body.score).toBe(9);
  });

  it('returns 404 if user rating not found', async () => {
    (mockRating.findFirst as jest.Mock).mockResolvedValueOnce(null);
    const response = await request(app).get('/v1/ratings/tv/1399/99');
    expect(response.status).toBe(404);
  });
});

describe('PUT /v1/ratings/:id (tv)', () => {
  it('updates a tv rating with valid token', async () => {
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 1399,
      userId: 1,
      score: 9,
    });
    (mockRating.update as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 1399,
      userId: 1,
      score: 10,
    });
    const response = await request(app).put('/v1/ratings/1').set(asUser).send({ score: 10 });
    expect(response.status).toBe(200);
  });

  it('returns 401 when token is missing', async () => {
    const response = await request(app).put('/v1/ratings/1').send({ score: 10 });
    expect(response.status).toBe(401);
  });

  it('non-owner gets 403', async () => {
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 1399,
      userId: 1,
      score: 9,
    });
    const response = await request(app).put('/v1/ratings/1').set(asOtherUser).send({ score: 10 });
    expect(response.status).toBe(403);
  });

  it('returns 404 if rating not found', async () => {
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const response = await request(app).put('/v1/ratings/1').set(asUser).send({ score: 10 });
    expect(response.status).toBe(404);
  });
});

describe('DELETE /v1/ratings/:id (tv)', () => {
  it('deletes a tv rating with valid token', async () => {
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 1399,
      userId: 1,
      score: 9,
    });
    (mockReview.updateMany as jest.Mock).mockResolvedValueOnce({ count: 0 });
    (mockRating.delete as jest.Mock).mockResolvedValueOnce({ id: 1 });
    const response = await request(app).delete('/v1/ratings/1').set(asUser);
    expect(response.status).toBe(204);
  });

  it('returns 401 when token is missing', async () => {
    const response = await request(app).delete('/v1/ratings/1');
    expect(response.status).toBe(401);
  });

  it('non-owner gets 403', async () => {
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 1399,
      userId: 1,
      score: 9,
    });
    const response = await request(app).delete('/v1/ratings/1').set(asOtherUser);
    expect(response.status).toBe(403);
  });

  it('returns 404 if rating not found', async () => {
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const response = await request(app).delete('/v1/ratings/1').set(asUser);
    expect(response.status).toBe(404);
  });
});
