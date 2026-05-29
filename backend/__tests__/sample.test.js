const request = require('supertest');

const ADMIN_API_KEY = 'test-admin-key';

let app;

beforeEach(() => {
  jest.resetModules();
  process.env.ADMIN_API_KEY = ADMIN_API_KEY;
  app = require('../server');
});

afterEach(() => {
  delete process.env.ADMIN_API_KEY;
});

test('GET /health returns ok', async () => {
  const res = await request(app).get('/health');

  expect(res.status).toBe(200);
  expect(res.body.status).toBe('ok');
});

test('admin routes reject requests without the configured API key', async () => {
  const res = await request(app)
    .post('/admin/add-item')
    .send({ name: 'Blocked Item', cost: 10 });

  expect(res.status).toBe(403);
  expect(res.body.error).toMatch(/denied/i);
});

test('admin routes accept requests with the configured API key', async () => {
  const addRes = await request(app)
    .post('/admin/add-item')
    .set('x-admin-api-key', ADMIN_API_KEY)
    .send({ name: 'Gold Badge', cost: 10 });

  expect(addRes.status).toBe(201);

  const listRes = await request(app)
    .get('/admin/store-items')
    .set('x-admin-api-key', ADMIN_API_KEY);

  expect(listRes.status).toBe(200);
  expect(listRes.body.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'Gold Badge', cost: 10 }),
    ])
  );
});