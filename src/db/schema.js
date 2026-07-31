// db/schema.js
// PharmaLink CRM — IndexedDB Schema (V1 — Frozen Architecture)
// Source of truth: 5 object stores, no additions/removals permitted without re-audit.

export const DB_NAME = 'pharmalink_crm';
export const DB_VERSION = 1;

export const STORE_NAMES = Object.freeze({
  MEDICINES: 'medicines',
  SUPPLIERS: 'suppliers',
  DEALS: 'deals',
  WHATSAPP_MESSAGES: 'whatsappMessages',
  META: 'meta',
});

/**
 * Schema definition consumed by db/connection.js during onupgradeneeded.
 * Each store: keyPath + indexes needed for lookups used across repos.
 */
export const SCHEMA = Object.freeze({
  [STORE_NAMES.MEDICINES]: {
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'name', keyPath: 'name', unique: false },
      { name: 'category', keyPath: 'category', unique: false },
    ],
  },

  [STORE_NAMES.SUPPLIERS]: {
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'name', keyPath: 'name', unique: false },
      { name: 'phone', keyPath: 'phone', unique: false },
    ],
    // Approved schema detail:
    // supplier.lastPrices = { [medicineId]: { price: number, date: string (ISO) } }
    // Map structure supports multiple medicines per supplier without data loss.
  },

  [STORE_NAMES.DEALS]: {
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'medicineId', keyPath: 'medicineId', unique: false },
      { name: 'supplierId', keyPath: 'supplierId', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'createdAt', keyPath: 'createdAt', unique: false },
    ],
  },

  [STORE_NAMES.WHATSAPP_MESSAGES]: {
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'groupId', keyPath: 'groupId', unique: false },
      { name: 'classification', keyPath: 'classification', unique: false },
      { name: 'receivedAt', keyPath: 'receivedAt', unique: false },
    ],
  },

  [STORE_NAMES.META]: {
    keyPath: 'key',
    autoIncrement: false,
    indexes: [],
  },
});

/**
 * Example shape reference (not enforced at runtime here —
 * enforcement lives in lib/validation/schemaGuards.js).
 *
 * supplier: {
 *   id: string,
 *   name: string,
 *   phone: string,
 *   lastPrices: {
 *     [medicineId]: { price: number, date: string }
 *   }
 * }
 */
