// src/state/orchestrators/backupRestore.js
// PharmaLink CRM — Backup / Restore Orchestrator (V1 — Frozen Architecture)
// Responsible ONLY for exporting all data to a JSON-serializable snapshot
// and restoring from one. Uses Repositories for reads, and transactions.js
// for an atomic all-or-nothing restore write. Never touches IndexedDB
// directly for export (read-only); uses raw stores only inside the shared
// transaction for restore, for the same reason completeDeal.js does:
// each repo's add/update opens its own independent transaction, so writing
// through repos individually cannot guarantee atomicity across four stores.
//
// This module backs the future Settings screen's JSON/Excel backup-restore
// feature. It intentionally does not touch the UI, Excel format, or any
// file-picker concerns — those belong to the (not yet built) Settings screen.

import { getAllMedicines } from '../../db/medicinesRepo.js';
import { getAllSuppliers } from '../../db/suppliersRepo.js';
import { getAllDeals } from '../../db/dealsRepo.js';
import { getAllMessages } from '../../db/whatsappRepo.js';
import { runAtomicTransaction } from '../../db/transactions.js';
import { STORE_NAMES } from '../../db/schema.js';
import {
  validateMedicine,
  validateSupplier,
  validateDeal,
  validateWhatsAppMessage,
} from '../../lib/validation/schemaGuards.js';

const BACKUP_FORMAT_VERSION = 1;

/**
 * Exports all current data as a single JSON-serializable snapshot.
 * Read-only: makes no changes to IndexedDB or appStore.
 * @returns {Promise<{formatVersion:number, exportedAt:string, medicines:object[], suppliers:object[], deals:object[], whatsappMessages:object[]}>}
 */
export function exportBackup() {
  return Promise.all([
    getAllMedicines(),
    getAllSuppliers(),
    getAllDeals(),
    getAllMessages(),
  ]).then(([medicines, suppliers, deals, whatsappMessages]) => ({
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    medicines,
    suppliers,
    deals,
    whatsappMessages,
  }));
}

/**
 * Validates every record in a backup snapshot against schemaGuards without
 * writing anything. Used internally by restoreBackup() before any write,
 * and exported so a future Settings screen can preview validation errors
 * before committing a restore.
 * @param {object} backup - object shaped like exportBackup()'s return value
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateBackup(backup) {
  const errors = [];

  if (!backup || typeof backup !== 'object') {
    return { valid: false, errors: ['backup يجب أن يكون Object.'] };
  }

  const sections = [
    ['medicines', validateMedicine],
    ['suppliers', validateSupplier],
    ['deals', validateDeal],
    ['whatsappMessages', validateWhatsAppMessage],
  ];

  sections.forEach(([key, validateFn]) => {
    const records = backup[key];
    if (!Array.isArray(records)) {
      errors.push(`${key} يجب أن يكون Array.`);
      return;
    }
    records.forEach((record, index) => {
      const { valid, errors: recordErrors } = validateFn(record);
      if (!valid) {
        errors.push(`${key}[${index}]: ${recordErrors.join(', ')}`);
      }
    });
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Restores all data from a backup snapshot atomically: every medicine,
 * supplier, deal, and WhatsApp message is validated first, then written
 * in a single transaction across all four stores. If any record is invalid,
 * or any write fails, nothing is written (full rollback).
 * Existing records with matching ids are overwritten (upsert semantics,
 * consistent with each repository's existing update()/put() behavior).
 * @param {object} backup - object shaped like exportBackup()'s return value
 * @returns {Promise<void>}
 */
export function restoreBackup(backup) {
  const { valid, errors } = validateBackup(backup);
  if (!valid) {
    return Promise.reject(new Error(`Invalid backup: ${errors.join('; ')}`));
  }

  const storeNames = [
    STORE_NAMES.MEDICINES,
    STORE_NAMES.SUPPLIERS,
    STORE_NAMES.DEALS,
    STORE_NAMES.WHATSAPP_MESSAGES,
  ];

  return runAtomicTransaction(storeNames, (tx) => {
    const medicinesStore = tx.objectStore(STORE_NAMES.MEDICINES);
    const suppliersStore = tx.objectStore(STORE_NAMES.SUPPLIERS);
    const dealsStore = tx.objectStore(STORE_NAMES.DEALS);
    const whatsappStore = tx.objectStore(STORE_NAMES.WHATSAPP_MESSAGES);

    backup.medicines.forEach((medicine) => medicinesStore.put(medicine));
    backup.suppliers.forEach((supplier) => suppliersStore.put(supplier));
    backup.deals.forEach((deal) => dealsStore.put(deal));
    backup.whatsappMessages.forEach((message) => whatsappStore.put(message));
  });
}
