// src/state/orchestrators/matchSupplier.js
// PharmaLink CRM — Match Supplier Orchestrator (V1 — Frozen Architecture)
// Responsible ONLY for finding candidate suppliers for a given medicine.
// Uses suppliersRepo for all reads and appStore for state updates.
// Never touches IndexedDB directly.
//
// Note on field usage: the approved schema/schemaGuards define suppliers via
// a `lastPrices` map ({ [medicineId]: { price, date } }), not a `medicineIds`
// array. Matching here filters on presence of a medicineId key in
// `lastPrices`, since that is the only field the current schema supports.

import { getAllSuppliers } from '../../db/suppliersRepo.js';
import { setState } from '../appStore.js';

/**
 * Finds all suppliers that have a recorded last price for the given medicine,
 * sorted by that price ascending (cheapest first), and reflects the result
 * in appStore under `matchedSuppliers`.
 *
 * @param {string} medicineId
 * @returns {Promise<object[]>} suppliers sorted by price ascending
 */
export function matchSupplier(medicineId) {
  if (typeof medicineId !== 'string' || medicineId.trim().length === 0) {
    return Promise.reject(new Error('medicineId is required and must be a non-empty string.'));
  }

  return getAllSuppliers().then((suppliers) => {
    const matched = suppliers
      .filter((supplier) => {
        const lastPrices = supplier.lastPrices || {};
        return Object.prototype.hasOwnProperty.call(lastPrices, medicineId);
      })
      .sort((a, b) => a.lastPrices[medicineId].price - b.lastPrices[medicineId].price);

    setState({
      matchedSuppliers: matched,
      lastMatchedMedicineId: medicineId,
    });

    return matched;
  });
}
