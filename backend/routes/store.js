/**
 * Store routes — handles credit management, purchases, donations,
 * and admin endpoints.
 */

'use strict';

const express = require('express');
const router = express.Router();

const { findOrCreate, getPlayer } = require('../models/Player');
const { addItem, getAllItems, getItemById } = require('../models/StoreItem');
const { logTransaction } = require('../models/Transaction');

/* ------------------------------------------------------------------ */
/*  POST /update-credits                                                */
/*  Body: { playerId, points, donated }                                 */
/*  Recalculates credits from points and donations.                     */
/* ------------------------------------------------------------------ */
router.post('/update-credits', (req, res) => {
  const { playerId, points, donated } = req.body;

  if (!playerId) {
    return res.status(400).json({ error: 'playerId is required' });
  }
  if (points !== undefined && (typeof points !== 'number' || points < 0)) {
    return res.status(400).json({ error: 'points must be a non-negative number' });
  }
  if (donated !== undefined && (typeof donated !== 'number' || donated < 0)) {
    return res.status(400).json({ error: 'donated must be a non-negative number' });
  }

  const player = findOrCreate(playerId);

  if (typeof points === 'number') player.points = points;
  if (typeof donated === 'number') player.donated = donated;

  player.recalculate();

  return res.json({ player: player.toJSON() });
});

/* ------------------------------------------------------------------ */
/*  POST /donate                                                        */
/*  Body: { playerId, amount }  (amount in dollars)                     */
/*  Adds credits based on donation amount.                              */
/* ------------------------------------------------------------------ */
router.post('/donate', (req, res) => {
  const { playerId, amount } = req.body;

  if (!playerId) {
    return res.status(400).json({ error: 'playerId is required' });
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }

  const player = findOrCreate(playerId);
  player.donated += amount;
  player.recalculate();

  return res.json({ player: player.toJSON() });
});

/* ------------------------------------------------------------------ */
/*  POST /purchase                                                      */
/*  Body: { playerId, itemId }                                          */
/*  Deducts credits and logs the transaction.                           */
/* ------------------------------------------------------------------ */
router.post('/purchase', (req, res) => {
  const { playerId, itemId } = req.body;

  if (!playerId) {
    return res.status(400).json({ error: 'playerId is required' });
  }
  if (itemId === undefined || itemId === null) {
    return res.status(400).json({ error: 'itemId is required' });
  }

  const player = getPlayer(playerId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  const item = getItemById(itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  if (player.credits < item.cost) {
    return res.status(402).json({ error: 'Insufficient credits' });
  }

  player.credits -= item.cost;

  const transaction = logTransaction({
    itemId: item.id,
    itemName: item.name,
    playerId: player.id,
    cost: item.cost,
  });

  return res.json({ player: player.toJSON(), transaction });
});

/* ------------------------------------------------------------------ */
/*  GET /admin/store-items                                              */
/*  Returns all store items.                                            */
/* ------------------------------------------------------------------ */
router.get('/admin/store-items', (req, res) => {
  return res.json({ items: getAllItems().map(i => i.toJSON()) });
});

/* ------------------------------------------------------------------ */
/*  POST /admin/add-item                                                */
/*  Body: { name, description, cost }                                   */
/*  Adds a new item to the store.                                       */
/* ------------------------------------------------------------------ */
router.post('/admin/add-item', (req, res) => {
  const { name, description, cost } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'name is required' });
  }
  if (typeof cost !== 'number' || cost < 0) {
    return res.status(400).json({ error: 'cost must be a non-negative number' });
  }

  const item = addItem({ name: name.trim(), description: description || '', cost });

  return res.status(201).json({ item: item.toJSON() });
});

module.exports = router;
