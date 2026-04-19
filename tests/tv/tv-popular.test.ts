import request from 'supertest';
import { app } from '../../src/app';

describe('/GET /tv/popular', () => {
  it('should return a list of popular TV shows', async () => {
    const response = await request(app).get('/tv/popular');
    expect(response.status).toBe(200);
    // todo: add more assertions based on the expected response structure
  });
});
