/**
 * Transaction log — records every purchase made in the store.
 */

'use strict';

const transactions = [];

function logTransaction({ itemId, itemName, playerId, cost }) {
  const entry = {
    id: transactions.length + 1,
    itemId,
    itemName,
    playerId,
    cost,
    timestamp: new Date().toISOString(),
  };
  transactions.push(entry);
  return entry;
}

function getAllTransactions() {
  return transactions.slice();
}

module.exports = { logTransaction, getAllTransactions };
