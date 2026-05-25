const request = require('supertest');

describe('store backend', () => {
  let app;
  let donationToCreditsRate;

  beforeEach(() => {
    jest.resetModules();
    app = require('../server');
    ({ CREDITS_PER_DOLLAR: donationToCreditsRate } = require('../models/Player'));
  });

  it('returns a health payload', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('recalculates player credits from points and donations', async () => {
    const points = 10;
    const donated = 1.5;
    const expectedCredits = points + Math.floor(donated * donationToCreditsRate);

    const response = await request(app)
      .post('/update-credits')
      .send({ playerId: 'player-1', points, donated });

    expect(response.status).toBe(200);
    expect(response.body.player).toMatchObject({
      id: 'player-1',
      points,
      donated,
      credits: expectedCredits,
    });
  });

  it('allows purchasing an admin-created item with available credits', async () => {
    const startingPoints = 75;
    const itemCost = 50;
    const addItemResponse = await request(app)
      .post('/admin/add-item')
      .send({ name: 'Hint Pack', description: 'Three hints', cost: itemCost });

    const fundingResponse = await request(app)
      .post('/update-credits')
      .send({ playerId: 'player-2', points: startingPoints });

    const purchaseResponse = await request(app)
      .post('/purchase')
      .send({ playerId: 'player-2', itemId: addItemResponse.body.item.id });

    expect(addItemResponse.status).toBe(201);
    expect(fundingResponse.status).toBe(200);
    expect(fundingResponse.body.player.credits).toBe(startingPoints);
    expect(purchaseResponse.status).toBe(200);
    expect(purchaseResponse.body.player.credits).toBe(startingPoints - itemCost);
    expect(purchaseResponse.body.transaction).toMatchObject({
      playerId: 'player-2',
      itemId: addItemResponse.body.item.id,
      itemName: 'Hint Pack',
      cost: itemCost,
    });
  });
});
