import request from 'supertest';
import { app } from '../../src/app';

jest.mock('../../src/middleware/resolveLocalUser', () => ({
  resolveLocalUser: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('timestamp');
  });
});
