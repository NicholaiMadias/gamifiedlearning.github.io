/**
 * Store model — manages items available in the player store.
 * In-memory store; replace with a database in production.
 */

'use strict';

let nextId = 1;
const items = new Map();

class StoreItem {
  constructor({ name, description, cost }) {
    this.id = nextId++;
    this.name = name;
    this.description = description || '';
    this.cost = cost;
    this.createdAt = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      cost: this.cost,
      createdAt: this.createdAt,
    };
  }
}

function addItem({ name, description, cost }) {
  const item = new StoreItem({ name, description, cost });
  items.set(item.id, item);
  return item;
}

function getAllItems() {
  return Array.from(items.values());
}

function getItemById(id) {
  return items.get(Number(id)) || null;
}

module.exports = { StoreItem, addItem, getAllItems, getItemById };
