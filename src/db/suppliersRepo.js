// src/db/suppliersRepo.js
// PharmaLink CRM — Suppliers Repository (V1 — Frozen Architecture)
// Vanilla IndexedDB. CRUD only. lastPrices map supported per approved schema.

import { openDatabase } from './connection.js';
import { STORE_NAMES } from './schema.js';
import { validateSupplier } from '../lib/validation/schemaGuards.js';

const STORE = STORE_NAMES.SUPPLIERS;

export function addSupplier(supplier) {
  const record = { lastPrices: {}, ...supplier };
  const { valid, errors } = validateSupplier(record);
  if (!valid) {
    return Promise.reject(new Error(`Invalid supplier: ${errors.join(', ')}`));
  }

  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const request = store.add(record);

      request.onsuccess = () => resolve(record.id);
      request.onerror = () =>
        reject(request.error || new Error('Failed to add supplier.'));
    });
  });
}

export function updateSupplier(supplier) {
  const { valid, errors } = validateSupplier(supplier);
  if (!valid) {
    return Promise.reject(new Error(`Invalid supplier: ${errors.join(', ')}`));
  }

  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const request = store.put(supplier);

      request.onsuccess = () => resolve(supplier.id);
      request.onerror = () =>
        reject(request.error || new Error('Failed to update supplier.'));
    });
  });
}

export function updateSupplierLastPrice(supplierId, medicineId, price, date) {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const getRequest = store.get(supplierId);

      getRequest.onsuccess = () => {
        const supplier = getRequest.result;
        if (!supplier) {
          reject(new Error(`Supplier not found: ${supplierId}`));
          return;
        }

        supplier.lastPrices = supplier.lastPrices || {};
        supplier.lastPrices[medicineId] = { price, date };

        const putRequest = store.put(supplier);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () =>
          reject(putRequest.error || new Error('Failed to update lastPrices.'));
      };

      getRequest.onerror = () =>
        reject(getRequest.error || new Error('Failed to read supplier.'));
    });
  });
}

export function getSupplierById(id) {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error || new Error('Failed to get supplier.'));
    });
  });
}

export function getAllSuppliers() {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () =>
        reject(request.error || new Error('Failed to get all suppliers.'));
    });
  });
}

export function deleteSupplier(id) {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error || new Error('Failed to delete supplier.'));
    });
  });
}
