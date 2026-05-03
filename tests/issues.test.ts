jest.mock('express-jwt', () => ({
  expressjwt: jest.fn(() => jest.fn()),
}));

jest.mock('jwks-rsa', () => ({
  expressJwtSecret: jest.fn(() => jest.fn()),
}));

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    issue: {
      create: jest.fn(),
    },
  },
}));

process.env.AUTH_ISSUER = 'https://example.test';
process.env.API_AUDIENCE = 'test-audience';

const request = require('supertest');
const { app } = require('../src/app');
const { prisma } = require('../src/lib/prisma');

const mockIssueCreate = (prisma as any).issue.create as jest.Mock<Promise<unknown>, [unknown]>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /v1/issues', () => {
  it('creates a new bug report and returns confirmation', async () => {
    mockIssueCreate.mockResolvedValueOnce({
      id: 100,
      status: 'NEW',
      createdAt: new Date('2026-05-02T13:04:00.000Z'),
    });

    const response = await request(app)
      .post('/v1/issues')
      .send({
        title: 'Search results fail',
        description: 'The discovery endpoint returns 500 when query is empty.',
        reporter: 'QA team',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      issueId: 100,
      status: 'NEW',
      message: 'Bug report submitted successfully',
      createdAt: '2026-05-02T13:04:00.000Z',
    });
    expect(mockIssueCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Search results fail',
          description: 'The discovery endpoint returns 500 when query is empty.',
          reporter: 'QA team',
        }),
      })
    );
  });

  it('rejects a request without title and description', async () => {
    const response = await request(app).post('/v1/issues').send({ reporter: 'QA' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Invalid bug report',
      details: ['A title or description is required'],
    });
    expect(mockIssueCreate).not.toHaveBeenCalled();
  });

  it('rejects an invalid reporterEmail', async () => {
    const response = await request(app)
      .post('/v1/issues')
      .send({ title: 'Bad email', description: 'Details here', reporterEmail: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Invalid bug report',
      details: ['reporterEmail must be a valid email address'],
    });
    expect(mockIssueCreate).not.toHaveBeenCalled();
  });
});
