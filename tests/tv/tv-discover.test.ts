import request from 'supertest';
import { app } from '../../src/app';

describe('GET /tv/search', () => {
  it('returns results when q is provided', async () => {
    const response = await request(app).get('/tv/search?q=test');
    expect(response.status).toBe(200);
    // todo: add more assertions based on the expected response structure
  });
  it('returns 400 when q is missing', async () => {
    const response = await request(app).get('/tv/search');
    expect(response.status).toBe(400);
    // todo: add more assertions based on the expected response structure
  });
});
