// src/db/medicinesRepo.js
// PharmaLink CRM — Medicines Repository (V1 — Frozen Architecture)
// Vanilla IndexedDB. CRUD only. No business logic beyond validation gating.

import { openDatabase } from './connection.js';
import { STORE_NAMES } from './schema.js';
import { validateMedicine } from '../lib/validation/schemaGuards.js';

const STORE = STORE_NAMES.MEDICINES;

export function addMedicine(medicine) {
  const { valid, errors } = validateMedicine(medicine);
  if (!valid) {
    return Promise.reject(new Error(`Invalid medicine: ${errors.join(', ')}`));
  }

  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const request = store.add(medicine);

      request.onsuccess = () => resolve(medicine.id);
      request.onerror = () =>
        reject(request.error || new Error('Failed to add medicine.'));
    });
  });
}

export function updateMedicine(medicine) {
  const { valid, errors } = validateMedicine(medicine);
  if (!valid) {
    return Promise.reject(new Error(`Invalid medicine: ${errors.join(', ')}`));
  }

  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const request = store.put(medicine);

      request.onsuccess = () => resolve(medicine.id);
      request.onerror = () =>
        reject(request.error || new Error('Failed to update medicine.'));
    });
  });
}

export function getMedicineById(id) {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error || new Error('Failed to get medicine.'));
    });
  });
}

export function getAllMedicines() {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () =>
        reject(request.error || new Error('Failed to get all medicines.'));
    });
  });
}

export function deleteMedicine(id) {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error || new Error('Failed to delete medicine.'));
    });
  });
}
