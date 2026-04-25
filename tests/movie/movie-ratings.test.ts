import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/prisma';
import { authHeader } from '../helpers';

jest.mock('../../src/prisma', () => ({
  prisma: {
    rating: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockRating = prisma.rating as jest.Mocked<typeof prisma.rating>;

const asUser = authHeader({ sub: 1, role: 'user' });
const asOtherUser = authHeader({ sub: 2, role: 'user' });
const asAdmin = authHeader({ sub: 99, role: 'admin' });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /v1/ratings', () => {
  it('creates a rating with valid token', async () => {
    (mockRating.create as jest.Mock).mockResolvedValueOnce({
      id: 1,
      tmdbId: 120,
      userId: 1,
      rating: 8,
    });

    const response = await request(app)
      .post('/v1/ratings')
      .set(asUser)
      .send({ tmdbId: 120, rating: 8 });

    expect(response.status).toBe(201);
    expect(mockRating.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 1 }),
      })
    );
  });

  it('returns 401 when token is missing', async () => {
    const response = await request(app).post('/v1/ratings').send({ tmdbId: 120, rating: 8 });

    expect(response.status).toBe(401);
  });

  it('returns 400 when tmdbId is missing', async () => {
    const response = await request(app).post('/v1/ratings').set(asUser).send({ rating: 8 });

    expect(response.status).toBe(400);
  });

  it('returns 400 when rating is missing', async () => {
    const response = await request(app).post('/v1/ratings').set(asUser).send({ tmdbId: 120 });

    expect(response.status).toBe(400);
  });
});

describe('GET /v1/ratings', () => {
  it('returns list of ratings for a tmdbId (public)', async () => {
    (mockRating.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 1,
        tmdbId: 120,
        userId: 1,
        rating: 8,
      },
    ]);

    const response = await request(app).get('/v1/ratings?tmdbId=120');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].tmdbId).toBe(120);
    expect(response.body[0].rating).toBe(8);
  });

  it('returns a list of ratings for a user', async () => {
    (mockRating.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 1,
        tmdbId: 120,
        userId: 1,
        rating: 8,
      },
      {
        id: 2,
        tmdbId: 155,
        userId: 1,
        rating: 9,
      },
    ]);

    const response = await request(app).get('/v1/ratings?userId=1');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].userId).toBe(1);
  });

  it('returns 404 when no ratings found for tmdbId', async () => {
    (mockRating.findMany as jest.Mock).mockResolvedValueOnce([]);

    const response = await request(app).get('/v1/ratings?tmdbId=999');

    expect(response.status).toBe(404);
  });
});

describe('PATCH /v1/ratings/:id', () => {
  it('updates a rating with valid token', async () => {
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      tmdbId: 120,
      userId: 1,
      rating: 8,
    });
    (mockRating.update as jest.Mock).mockResolvedValueOnce({
      id: 1,
      tmdbId: 120,
      userId: 1,
      rating: 9,
    });

    const response = await request(app).patch('/v1/ratings/1').set(asUser).send({ rating: 9 });

    expect(response.status).toBe(200);
  });

  it('non-owner gets 403', async () => {
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      tmdbId: 120,
      userId: 1,
      rating: 8,
    });

    const response = await request(app).patch('/v1/ratings/1').set(asOtherUser).send({ rating: 9 });

    expect(response.status).toBe(403);
  });

  it('returns 404 if rating not found', async () => {
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const response = await request(app).patch('/v1/ratings/1').set(asUser).send({ rating: 9 });

    expect(response.status).toBe(404);
  });
});

describe('DELETE /v1/ratings/:id', () => {
  it('deletes a rating with valid token', async () => {
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      tmdbId: 120,
      userId: 1,
      rating: 8,
    });
    (mockRating.delete as jest.Mock).mockResolvedValueOnce({ id: 1 });

    const response = await request(app).delete('/v1/ratings/1').set(asUser);

    expect(response.status).toBe(200);
    expect(mockRating.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 1 }),
      })
    );
  });

  it('admin can delete any rating', async () => {
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      tmdbId: 120,
      userId: 1,
      rating: 8,
    });
    (mockRating.delete as jest.Mock).mockResolvedValueOnce({ id: 1 });

    const response = await request(app).delete('/v1/ratings/1').set(asAdmin);

    expect(response.status).toBe(200);
    expect(mockRating.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 1 }),
      })
    );
  });

  it('non-owner gets 403', async () => {
    (mockRating.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      tmdbId: 120,
      userId: 1,
      rating: 8,
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
