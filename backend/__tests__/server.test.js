const request = require('supertest');

describe('store backend', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();
    app = require('../server');
  });

  it('returns a health payload', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('recalculates player credits from points and donations', async () => {
    const response = await request(app)
      .post('/update-credits')
      .send({ playerId: 'player-1', points: 10, donated: 1.5 });

    expect(response.status).toBe(200);
    expect(response.body.player).toMatchObject({
      id: 'player-1',
      points: 10,
      donated: 1.5,
      credits: 460,
    });
  });

  it('allows purchasing an admin-created item with available credits', async () => {
    const addItemResponse = await request(app)
      .post('/admin/add-item')
      .send({ name: 'Hint Pack', description: 'Three hints', cost: 50 });

    await request(app)
      .post('/update-credits')
      .send({ playerId: 'player-2', points: 75 });

    const purchaseResponse = await request(app)
      .post('/purchase')
      .send({ playerId: 'player-2', itemId: addItemResponse.body.item.id });

    expect(addItemResponse.status).toBe(201);
    expect(purchaseResponse.status).toBe(200);
    expect(purchaseResponse.body.player.credits).toBe(25);
    expect(purchaseResponse.body.transaction).toMatchObject({
      playerId: 'player-2',
      itemId: addItemResponse.body.item.id,
      itemName: 'Hint Pack',
      cost: 50,
    });
  });
});
