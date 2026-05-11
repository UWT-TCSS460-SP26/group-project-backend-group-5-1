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

describe('POST /v1/ratings', () => {
  it('creates a rating with valid token', async () => {
    (mockRating.findFirst as jest.Mock).mockResolvedValueOnce(null);
    (mockRating.create as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 120,
      mediaType: 'movie',
      userId: 1,
      score: 8,
      user: { id: 1, username: 'alice', firstName: 'Alice', lastName: 'Smith' },
    });
    (mockReview.findFirst as jest.Mock).mockResolvedValueOnce(null);

    const response = await request(app)
      .post('/v1/ratings')
      .set(asUser)
      .send({ mediaId: 120, mediaType: 'movie', score: 8 });

    expect(response.status).toBe(201);
    expect(mockRating.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 1 }) })
    );
  });

  it('returns 401 when token is missing', async () => {
    const response = await request(app)
      .post('/v1/ratings')
      .send({ mediaId: 120, mediaType: 'movie', score: 8 });
    expect(response.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const response = await request(app)
      .post('/v1/ratings')
      .set({ Authorization: 'Bearer not.a.valid.token' })
      .send({ mediaId: 120, mediaType: 'movie', score: 8 });
    expect(response.status).toBe(401);
  });

  it('returns 400 when mediaId is missing', async () => {
    const response = await request(app)
      .post('/v1/ratings')
      .set(asUser)
      .send({ mediaType: 'movie', score: 8 });
    expect(response.status).toBe(400);
  });

  it('returns 400 when score is missing', async () => {
    const response = await request(app)
      .post('/v1/ratings')
      .set(asUser)
      .send({ mediaId: 120, mediaType: 'movie' });
    expect(response.status).toBe(400);
  });

  it('returns 409 when rating already exists', async () => {
    (mockRating.findFirst as jest.Mock).mockResolvedValueOnce({ id: 1 });
    const response = await request(app)
      .post('/v1/ratings')
      .set(asUser)
      .send({ mediaId: 120, mediaType: 'movie', score: 8 });
    expect(response.status).toBe(409);
  });
});

describe('GET /v1/ratings/movie/:mediaId', () => {
  it('returns list of ratings for a movie (public)', async () => {
    (mockRating.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 1,
        mediaId: 120,
        mediaType: 'movie',
        userId: 1,
        score: 8,
        user: { id: 1, username: 'alice', firstName: 'Alice', lastName: 'Smith' },
      },
    ]);
    const response = await request(app).get('/v1/ratings/movie/120');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].mediaId).toBe(120);
    expect(response.body[0].score).toBe(8);
    expect(response.body[0].user.username).toBe('alice');
    expect(response.body[0].user.firstName).toBe('Alice');
    expect(response.body[0].user.lastName).toBe('Smith');
  });

  it('returns empty array when no ratings found', async () => {
    (mockRating.findMany as jest.Mock).mockResolvedValueOnce([]);
    const response = await request(app).get('/v1/ratings/movie/999');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(0);
  });

  it('returns 404 for a negative mediaId', async () => {
    const response = await request(app).get('/v1/ratings/movie/-1');
    expect(response.status).toBe(404);
  });
});

describe('GET /v1/ratings/movie/:mediaId/:userId', () => {
  it('returns a specific user rating (public)', async () => {
    (mockRating.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 120,
      mediaType: 'movie',
      userId: 1,
      score: 8,
      user: { id: 1, username: 'alice', firstName: 'Alice', lastName: 'Smith' },
    });
    const response = await request(app).get('/v1/ratings/movie/120/1');
    expect(response.status).toBe(200);
    expect(response.body.score).toBe(8);
    expect(response.body.user.username).toBe('alice');
    expect(response.body.user.firstName).toBe('Alice');
    expect(response.body.user.lastName).toBe('Smith');
  });

  it('returns 404 if user rating not found', async () => {
    (mockRating.findFirst as jest.Mock).mockResolvedValueOnce(null);
    const response = await request(app).get('/v1/ratings/movie/120/99');
    expect(response.status).toBe(404);
  });

  it('returns 404 for a negative mediaId', async () => {
    const response = await request(app).get('/v1/ratings/movie/-5/1');
    expect(response.status).toBe(404);
  });

  it('returns 404 for a negative userId', async () => {
    const response = await request(app).get('/v1/ratings/movie/120/-3');
    expect(response.status).toBe(404);
  });
});

describe('PUT /v1/ratings/:id', () => {
  it('returns 404 for a negative rating id', async () => {
    const response = await request(app).put('/v1/ratings/-1').set(asUser).send({ score: 9 });
    expect(response.status).toBe(404);
  });

  it('updates a rating with valid token', async () => {
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 120,
      userId: 1,
      score: 8,
    });
    (mockRating.update as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 120,
      userId: 1,
      score: 9,
      user: { id: 1, username: 'alice', firstName: 'Alice', lastName: 'Smith' },
    });
    const response = await request(app).put('/v1/ratings/1').set(asUser).send({ score: 9 });
    expect(response.status).toBe(200);
  });

  it('returns 401 when token is missing', async () => {
    const response = await request(app).put('/v1/ratings/1').send({ score: 9 });
    expect(response.status).toBe(401);
  });

  it('non-owner gets 403', async () => {
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 120,
      userId: 1,
      score: 8,
    });
    const response = await request(app).put('/v1/ratings/1').set(asOtherUser).send({ score: 9 });
    expect(response.status).toBe(403);
  });

  it('returns 404 if rating not found', async () => {
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const response = await request(app).put('/v1/ratings/1').set(asUser).send({ score: 9 });
    expect(response.status).toBe(404);
  });
});

describe('DELETE /v1/ratings/:id', () => {
  it('returns 404 for a negative rating id', async () => {
    const response = await request(app).delete('/v1/ratings/-1').set(asUser);
    expect(response.status).toBe(404);
  });

  it('deletes a rating with valid token', async () => {
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      mediaId: 120,
      userId: 1,
      score: 8,
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
      mediaId: 120,
      userId: 1,
      score: 8,
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
