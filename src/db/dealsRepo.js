// src/db/dealsRepo.js
// PharmaLink CRM — Deals Repository (V1 — Frozen Architecture)
// Vanilla IndexedDB. CRUD only.

import { openDatabase } from './connection.js';
import { STORE_NAMES } from './schema.js';
import { validateDeal } from '../lib/validation/schemaGuards.js';

const STORE = STORE_NAMES.DEALS;

export function addDeal(deal) {
  const { valid, errors } = validateDeal(deal);
  if (!valid) {
    return Promise.reject(new Error(`Invalid deal: ${errors.join(', ')}`));
  }
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const request = tx.objectStore(STORE).add(deal);
      request.onsuccess = () => resolve(deal.id);
      request.onerror = () =>
        reject(request.error || new Error('Failed to add deal.'));
    });
  });
}

export function updateDeal(deal) {
  const { valid, errors } = validateDeal(deal);
  if (!valid) {
    return Promise.reject(new Error(`Invalid deal: ${errors.join(', ')}`));
  }
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const request = tx.objectStore(STORE).put(deal);
      request.onsuccess = () => resolve(deal.id);
      request.onerror = () =>
        reject(request.error || new Error('Failed to update deal.'));
    });
  });
}

export function getDealById(id) {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error || new Error('Failed to get deal.'));
    });
  });
}

export function getAllDeals() {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () =>
        reject(request.error || new Error('Failed to get all deals.'));
    });
  });
}

export function deleteDeal(id) {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const request = tx.objectStore(STORE).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error || new Error('Failed to delete deal.'));
    });
  });
}
