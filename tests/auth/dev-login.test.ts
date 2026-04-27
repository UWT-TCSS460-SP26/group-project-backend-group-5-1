import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    user: {
      upsert: jest.fn(),
    },
  },
}));

const mockUser = prisma.user as jest.Mocked<typeof prisma.user>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /auth/dev-login', () => {
  it('returns a token for a valid username', async () => {
    (mockUser.upsert as jest.Mock).mockResolvedValueOnce({
      id: 1,
      username: 'evin',
      email: 'evin@dev.local',
      role: 'user',
    });

    const response = await request(app).post('/auth/dev-login').send({ username: 'evin' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  it('returns 400 when username is missing', async () => {
    const response = await request(app).post('/auth/dev-login').send({});

    expect(response.status).toBe(400);
  });

  it('defaults email to username@dev.local when not provided', async () => {
    (mockUser.upsert as jest.Mock).mockResolvedValueOnce({
      id: 1,
      username: 'evin',
      email: 'evin@dev.local',
      role: 'user',
    });

    const response = await request(app).post('/auth/dev-login').send({ username: 'evin' });

    expect(response.status).toBe(200);
    expect(mockUser.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ email: 'evin@dev.local' }),
      })
    );
  });

  it('token contains correct sub, email and role', async () => {
    (mockUser.upsert as jest.Mock).mockResolvedValueOnce({
      id: 1,
      username: 'evin',
      email: 'evin@dev.local',
      role: 'user',
    });

    const response = await request(app).post('/auth/dev-login').send({ username: 'evin' });

    const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET!) as jwt.JwtPayload;

    expect(decoded.sub).toBe(1);
    expect(decoded.email).toBe('evin@dev.local');
    expect(decoded.role).toBe('user');
  });

  it('accepts optional email in request body', async () => {
    (mockUser.upsert as jest.Mock).mockResolvedValueOnce({
      id: 2,
      username: 'carson',
      email: 'carson@example.com',
      role: 'user',
    });

    const response = await request(app)
      .post('/auth/dev-login')
      .send({ username: 'carson', email: 'carson@example.com' });

    expect(response.status).toBe(200);
    expect(mockUser.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ email: 'carson@example.com' }),
      })
    );
  });
});
