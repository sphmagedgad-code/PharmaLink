// src/db/transactions.js
// PharmaLink CRM — Cross-Store Transaction Helpers (V1 — Frozen Architecture)
// Vanilla IndexedDB. Reusable atomic transaction wrapper only. No business rules.

import { openDatabase } from './connection.js';

export function runAtomicTransaction(storeNames, operation) {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeNames, 'readwrite');

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Transaction failed.'));
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted.'));

      try {
        operation(tx);
      } catch (err) {
        reject(err);
      }
    });
  });
}
