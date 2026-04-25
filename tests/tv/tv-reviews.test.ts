import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/prisma';
import { authHeader } from '../helpers';

jest.mock('../../src/prisma', () => ({
  prisma: {
    review: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockReview = prisma.review as jest.Mocked<typeof prisma.review>;

const asUser = authHeader({ sub: 1, role: 'user' });
const asOtherUser = authHeader({ sub: 2, role: 'user' });
const asAdmin = authHeader({ sub: 99, role: 'admin' });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /v1/tv-reviews', () => {
  it('creates a tv review with valid token', async () => {
    (mockReview.create as jest.Mock).mockResolvedValueOnce({
      id: 1,
      tmdbId: 1399,
      userId: 1,
      body: 'Too much ragebait in the boys by butcher. .',
    });

    const response = await request(app)
      .post('/v1/tv-reviews')
      .set(asUser)
      .send({ tmdbId: 1399, body: 'Too much ragebait in the boys by butcher.' });

    expect(response.status).toBe(201);
    expect(mockReview.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 1 }),
      })
    );
  });

  it('returns 401 when token is missing', async () => {
    const response = await request(app)
      .post('/v1/tv-reviews')
      .send({ tmdbId: 1399, body: 'Too much ragebait in the boys by butcher.' });

    expect(response.status).toBe(401);
  });

  it('returns 400 when tmdbId is missing', async () => {
    const response = await request(app)
      .post('/v1/tv-reviews')
      .set(asUser)
      .send({ body: 'Too much ragebait in the boys by butcher.' });

    expect(response.status).toBe(400);
  });

  it('returns 400 when body is missing', async () => {
    const response = await request(app).post('/v1/tv-reviews').set(asUser).send({ tmdbId: 1399 });

    expect(response.status).toBe(400);
  });
});

describe('GET /v1/tv-reviews', () => {
  it('returns list of reviews for a tmdbId (public)', async () => {
    (mockReview.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 1,
        tmdbId: 1399,
        userId: 1,
        body: 'Too much ragebait in the boys by butcher.',
      },
    ]);

    const response = await request(app).get('/v1/tv-reviews?tmdbId=1399');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].tmdbId).toBe(1399);
    expect(response.body[0].body).toBe('Too much ragebait in the boys by butcher.');
  });

  it('returns a list of reviews for a user', async () => {
    (mockReview.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 1,
        tmdbId: 1399,
        userId: 1,
        body: 'Too much ragebait in the boys by butcher.',
      },
      {
        id: 2,
        tmdbId: 1396,
        userId: 1,
        body: 'I am a homelander for life.',
      },
    ]);

    const response = await request(app).get('/v1/tv-reviews?userId=1');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].userId).toBe(1);
  });

  it('returns 404 when no reviews found for tmdbId', async () => {
    (mockReview.findMany as jest.Mock).mockResolvedValueOnce([]);

    const response = await request(app).get('/v1/tv-reviews?tmdbId=999');

    expect(response.status).toBe(404);
  });
});

describe('PATCH /v1/tv-reviews/:id', () => {
  it('updates a review with valid token', async () => {
    (mockReview.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      tmdbId: 1399,
      userId: 1,
      body: 'Too much ragebait in the boys by butcher.',
    });
    (mockReview.update as jest.Mock).mockResolvedValueOnce({
      id: 1,
      tmdbId: 1399,
      userId: 1,
      body: 'Homelander was right.',
    });

    const response = await request(app)
      .patch('/v1/tv-reviews/1')
      .set(asUser)
      .send({ body: 'Homelander was right.' });

    expect(response.status).toBe(200);
  });

  it('non-owner gets 403', async () => {
    (mockReview.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      tmdbId: 1399,
      userId: 1,
      body: 'Too much ragebait in the boys by butcher.',
    });

    const response = await request(app)
      .patch('/v1/tv-reviews/1')
      .set(asOtherUser)
      .send({ body: 'I did not like homelander.' });

    expect(response.status).toBe(403);
  });

  it('returns 404 if review not found', async () => {
    (mockReview.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const response = await request(app)
      .patch('/v1/tv-reviews/1')
      .set(asUser)
      .send({ body: 'I did not like honelander.' });

    expect(response.status).toBe(404);
  });
});

describe('DELETE /v1/tv-reviews/:id', () => {
  it('deletes a review with valid token', async () => {
    (mockReview.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      tmdbId: 1399,
      userId: 1,
      body: 'Too much ragebait in the boys by butcher.',
    });
    (mockReview.delete as jest.Mock).mockResolvedValueOnce({ id: 1 });

    const response = await request(app).delete('/v1/tv-reviews/1').set(asUser);

    expect(response.status).toBe(200);
    expect(mockReview.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 1 }),
      })
    );
  });

  it('admin can delete any review', async () => {
    (mockReview.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      tmdbId: 1399,
      userId: 1,
      body: 'Too much ragebait in the boys by butcher.',
    });
    (mockReview.delete as jest.Mock).mockResolvedValueOnce({ id: 1 });

    const response = await request(app).delete('/v1/tv-reviews/1').set(asAdmin);

    expect(response.status).toBe(200);
    expect(mockReview.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 1 }),
      })
    );
  });

  it('non-owner gets 403', async () => {
    (mockReview.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 1,
      tmdbId: 1399,
      userId: 1,
      body: 'Too much ragebait in the boys by butcher.',
    });

    const response = await request(app).delete('/v1/tv-reviews/1').set(asOtherUser);

    expect(response.status).toBe(403);
  });

  it('returns 404 if review not found', async () => {
    (mockReview.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const response = await request(app).delete('/v1/tv-reviews/1').set(asUser);

    expect(response.status).toBe(404);
  });
});
