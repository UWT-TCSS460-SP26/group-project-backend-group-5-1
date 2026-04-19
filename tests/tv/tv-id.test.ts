import request from 'supertest';
import { app } from '../../src/app';

describe('GET /tv/details', () => {
  it('returns details when id is provided', async () => {
    const response = await request(app).get('/tv/details?id=123');
    expect(response.status).toBe(200);
    // todo: add more assertions based on the expected response structure
  });
  it('returns 400 when id is missing', async () => {
    const response = await request(app).get('/tv/details');
    expect(response.status).toBe(400);
    // todo: add more assertions based on the expected response structure
  });
  it('returns 404 when id is not found', async () => {
    const response = await request(app).get('/tv/details?id=999999');
    expect(response.status).toBe(404);
    // todo: add more assertions based on the expected response structure
  });
});
