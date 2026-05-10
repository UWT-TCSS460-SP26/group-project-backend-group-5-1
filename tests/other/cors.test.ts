import request from 'supertest';
import { app } from '../../src/app';

describe('CORS preflight', () => {
  it('allows requests from a whitelisted origin', async () => {
    const allowedOrigin = process.env.CORS_ALLOWED_ORIGINS?.split(',')[0] ?? 'http://localhost:3001';

    const response = await request(app)
      .options('/v1/movies')
      .set('Origin', allowedOrigin)
      .set('Access-Control-Request-Method', 'GET');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin);
  });

  it('blocks requests from an unknown origin', async () => {
    const response = await request(app)
      .options('/v1/movies')
      .set('Origin', 'http://evil.com')
      .set('Access-Control-Request-Method', 'GET');

    expect(response.headers['access-control-allow-origin']).not.toBe('http://evil.com');
  });
});