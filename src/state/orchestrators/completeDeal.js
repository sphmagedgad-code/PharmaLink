// src/state/orchestrators/completeDeal.js
// PharmaLink CRM — Complete Deal Orchestrator (V1 — Frozen Architecture)
// Responsible ONLY for the "complete a deal" workflow.
// Persists atomically via transactions.js, then reflects the result in appStore.
//
// Why this file touches object stores directly instead of calling
// dealsRepo.addDeal() / suppliersRepo.updateSupplierLastPrice():
// each of those repo functions opens its OWN independent IndexedDB transaction.
// Two independently-opened transactions cannot be combined into one atomic
// unit — if the first commits and the second fails, the first cannot be
// rolled back. True atomicity requires both writes to happen inside the
// single shared transaction that runAtomicTransaction() opens. This is an
// IndexedDB constraint, not an architecture change: transactions.js already
// exists in the frozen architecture for exactly this purpose, and validation
// still goes through the same schemaGuards used by the repositories.

import { runAtomicTransaction } from '../../db/transactions.js';
import { STORE_NAMES } from '../../db/schema.js';
import { validateDeal, validateSupplier } from '../../lib/validation/schemaGuards.js';
import { getState, setState } from '../appStore.js';

/**
 * Completes a deal atomically:
 * 1. Adds the deal record.
 * 2. Merges the agreed buy price into the supplier's lastPrices map.
 * 3. Updates appStore — only after the transaction has fully committed.
 *
 * If either the deal insert or the supplier update fails (including the
 * supplier not being found), the whole transaction aborts and IndexedDB
 * rolls back both operations. Nothing is written and appStore is untouched.
 *
 * @param {object} deal - a full deal object matching validateDeal() requirements
 *   (id, medicineId, supplierId, buyerId, quantity, buyPrice, sellPrice,
 *   status, createdAt, and optionally profit, paymentStatus, updatedAt, notes)
 * @returns {Promise<object>} the persisted deal object
 */
export function completeDeal(deal) {
  const dealCheck = validateDeal(deal);
  if (!dealCheck.valid) {
    return Promise.reject(new Error(`Invalid deal: ${dealCheck.errors.join(', ')}`));
  }

  const storeNames = [STORE_NAMES.DEALS, STORE_NAMES.SUPPLIERS];

  return runAtomicTransaction(storeNames, (tx) => {
    const dealsStore = tx.objectStore(STORE_NAMES.DEALS);
    const suppliersStore = tx.objectStore(STORE_NAMES.SUPPLIERS);

    // 1. Add the deal. If a deal with this id already exists, the request
    // errors, which aborts the whole transaction (no partial writes).
    dealsStore.add(deal);

    // 2. Read the supplier, merge in the new lastPrices entry, write it back.
    const getSupplierRequest = suppliersStore.get(deal.supplierId);

    getSupplierRequest.onsuccess = () => {
      const supplier = getSupplierRequest.result;

      if (!supplier) {
        // Throwing inside an async IDBRequest callback is not reliably
        // guaranteed by spec to abort the transaction across engines.
        // tx.abort() is the deterministic, spec-guaranteed rollback path.
        tx.abort();
        return;
      }

      const updatedSupplier = {
        ...supplier,
        lastPrices: {
          ...(supplier.lastPrices || {}),
          [deal.medicineId]: { price: deal.buyPrice, date: deal.createdAt },
        },
      };

      const supplierCheck = validateSupplier(updatedSupplier);
      if (!supplierCheck.valid) {
        tx.abort();
        return;
      }

      suppliersStore.put(updatedSupplier);
    };
  }).then(() => {
    // Reached only after tx.oncomplete — both writes are durably committed.
    const currentDeals = getState().deals || [];
    setState({ deals: [...currentDeals, deal] });
    return deal;
  });
}
