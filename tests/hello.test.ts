import request from 'supertest';
import { app } from '../src/app';

describe('Hello Route', () => {
  it('GET /hello — returns greeting message', async () => {
    const response = await request(app).get('/hello');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Hello, TCSS 460!');
  });

  it('GET /hello/carson-poirier — returns personalized greeting', async () => {
    const response = await request(app).get('/hello/carson-poirier');
    expect(response.status).toBe(200);
    expect(response.body.greeting).toBe('Hello, Carson Poirier!');
  });
});
