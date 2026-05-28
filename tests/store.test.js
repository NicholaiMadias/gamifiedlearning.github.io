'use strict';

/**
 * Integration tests for the AmazingGraceHomeLiving store backend.
 * Tests all REST endpoints: /update-credits, /donate, /purchase,
 * /admin/add-item, and /admin/store-items.
 */

const request = require('supertest');

// Isolate module state between tests
let app;
beforeEach(() => {
  jest.resetModules();
  app = require('../backend/server');
});

describe('Health check', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('POST /update-credits', () => {
  it('creates a player and sets credits from points', async () => {
    const res = await request(app)
      .post('/update-credits')
      .send({ playerId: 'p1', points: 100, donated: 0 });

    expect(res.status).toBe(200);
    expect(res.body.player.credits).toBe(100);
    expect(res.body.player.points).toBe(100);
  });

  it('sets credits from donation (300 credits per dollar)', async () => {
    const res = await request(app)
      .post('/update-credits')
      .send({ playerId: 'p2', points: 0, donated: 2 });

    expect(res.status).toBe(200);
    expect(res.body.player.credits).toBe(600);
    expect(res.body.player.donated).toBe(2);
  });

  it('combines points and donations', async () => {
    const res = await request(app)
      .post('/update-credits')
      .send({ playerId: 'p3', points: 50, donated: 1 });

    expect(res.status).toBe(200);
    // 50 points * 1 + 1 dollar * 300 = 350
    expect(res.body.player.credits).toBe(350);
  });

  it('returns 400 when playerId is missing', async () => {
    const res = await request(app)
      .post('/update-credits')
      .send({ points: 10 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/playerId/);
  });

  it('returns 400 for negative points', async () => {
    const res = await request(app)
      .post('/update-credits')
      .send({ playerId: 'p4', points: -5 });

    expect(res.status).toBe(400);
  });
});

describe('POST /donate', () => {
  it('adds credits based on donation amount', async () => {
    // First set up a player
    await request(app)
      .post('/update-credits')
      .send({ playerId: 'donor1', points: 0, donated: 0 });

    const res = await request(app)
      .post('/donate')
      .send({ playerId: 'donor1', amount: 1 });

    expect(res.status).toBe(200);
    expect(res.body.player.credits).toBe(300);
    expect(res.body.player.donated).toBe(1);
  });

  it('accumulates multiple donations', async () => {
    await request(app).post('/donate').send({ playerId: 'donor2', amount: 1 });
    const res = await request(app)
      .post('/donate')
      .send({ playerId: 'donor2', amount: 0.5 });

    expect(res.status).toBe(200);
    // 1.5 dollars * 300 = 450
    expect(res.body.player.credits).toBe(450);
  });

  it('returns 400 when amount is missing', async () => {
    const res = await request(app)
      .post('/donate')
      .send({ playerId: 'donor3' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for zero amount', async () => {
    const res = await request(app)
      .post('/donate')
      .send({ playerId: 'donor4', amount: 0 });

    expect(res.status).toBe(400);
  });
});

describe('POST /admin/add-item and GET /admin/store-items', () => {
  it('adds an item and retrieves it', async () => {
    const addRes = await request(app)
      .post('/admin/add-item')
      .send({ name: 'Gold Badge', description: 'A shiny badge', cost: 150 });

    expect(addRes.status).toBe(201);
    expect(addRes.body.item.name).toBe('Gold Badge');
    expect(addRes.body.item.cost).toBe(150);
    expect(addRes.body.item.id).toBeDefined();

    const listRes = await request(app).get('/admin/store-items');
    expect(listRes.status).toBe(200);
    expect(listRes.body.items.length).toBeGreaterThanOrEqual(1);
    const found = listRes.body.items.find(i => i.name === 'Gold Badge');
    expect(found).toBeDefined();
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/admin/add-item')
      .send({ cost: 50 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/);
  });

  it('returns 400 when cost is negative', async () => {
    const res = await request(app)
      .post('/admin/add-item')
      .send({ name: 'Invalid', cost: -10 });

    expect(res.status).toBe(400);
  });
});

describe('POST /purchase', () => {
  it('purchases an item and deducts credits', async () => {
    // Set up player with credits
    await request(app)
      .post('/update-credits')
      .send({ playerId: 'buyer1', points: 500, donated: 0 });

    // Add an item
    const itemRes = await request(app)
      .post('/admin/add-item')
      .send({ name: 'Star Sticker', cost: 100 });
    const itemId = itemRes.body.item.id;

    // Purchase
    const res = await request(app)
      .post('/purchase')
      .send({ playerId: 'buyer1', itemId });

    expect(res.status).toBe(200);
    expect(res.body.player.credits).toBe(400); // 500 - 100
    expect(res.body.transaction).toBeDefined();
    expect(res.body.transaction.itemId).toBe(itemId);
    expect(res.body.transaction.playerId).toBe('buyer1');
    expect(res.body.transaction.cost).toBe(100);
    expect(res.body.transaction.timestamp).toBeDefined();
  });

  it('returns 402 when player has insufficient credits', async () => {
    await request(app)
      .post('/update-credits')
      .send({ playerId: 'broke1', points: 10, donated: 0 });

    const itemRes = await request(app)
      .post('/admin/add-item')
      .send({ name: 'Expensive Trophy', cost: 9999 });
    const itemId = itemRes.body.item.id;

    const res = await request(app)
      .post('/purchase')
      .send({ playerId: 'broke1', itemId });

    expect(res.status).toBe(402);
    expect(res.body.error).toMatch(/Insufficient/);
  });

  it('returns 404 when player does not exist', async () => {
    const itemRes = await request(app)
      .post('/admin/add-item')
      .send({ name: 'Test Item', cost: 1 });
    const itemId = itemRes.body.item.id;

    const res = await request(app)
      .post('/purchase')
      .send({ playerId: 'nonexistent', itemId });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Player/);
  });

  it('returns 404 when item does not exist', async () => {
    await request(app)
      .post('/update-credits')
      .send({ playerId: 'buyer2', points: 100, donated: 0 });

    const res = await request(app)
      .post('/purchase')
      .send({ playerId: 'buyer2', itemId: 999999 });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Item/);
  });

  it('returns 400 when itemId is missing', async () => {
    const res = await request(app)
      .post('/purchase')
      .send({ playerId: 'buyer3' });

    expect(res.status).toBe(400);
  });
});
