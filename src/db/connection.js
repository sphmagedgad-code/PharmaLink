// src/db/connection.js
// PharmaLink CRM — IndexedDB Connection (V1 — Frozen Architecture)
// Vanilla IndexedDB only. No external libraries. Mobile-first (Realme C12 / low RAM).

import { DB_NAME, DB_VERSION, SCHEMA } from './schema.js';

let dbInstance = null;

/**
 * Opens (and if needed upgrades) the single IndexedDB database
 * used across the whole app. Safe to call multiple times —
 * returns the cached connection after the first successful open.
 *
 * @returns {Promise<IDBDatabase>}
 */
export function openDatabase() {
  // Reuse existing connection instead of opening a new one per call.
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported on this device.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    // Runs only on first creation or version bump.
    // Builds all stores/indexes directly from schema.js — single source of truth.
    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      Object.entries(SCHEMA).forEach(([storeName, storeDef]) => {
        let store;

        if (!db.objectStoreNames.contains(storeName)) {
          store = db.createObjectStore(storeName, {
            keyPath: storeDef.keyPath,
            autoIncrement: storeDef.autoIncrement,
          });
        } else {
          // Store already exists from a previous version — reuse it
          // via the versionchange transaction to add any new indexes.
          store = event.target.transaction.objectStore(storeName);
        }

        (storeDef.indexes || []).forEach((indexDef) => {
          if (!store.indexNames.contains(indexDef.name)) {
            store.createIndex(indexDef.name, indexDef.keyPath, {
              unique: indexDef.unique,
            });
          }
        });
      });
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;

      // If a store is deleted in a future schema version from another tab,
      // close gracefully instead of leaving a stale connection open.
      dbInstance.onversionchange = () => {
        dbInstance.close();
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject(event.target.error || new Error('Failed to open PharmaLink database.'));
    };

    request.onblocked = () => {
      reject(new Error('Database open blocked — close other open tabs of this app.'));
    };
  });
}

/**
 * Closes the current connection. Useful for tests or explicit teardown.
 */
export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
