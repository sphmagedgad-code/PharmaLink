// src/ui/dashboard.js
// PharmaLink OS — Dashboard Screen (V1)
// Reads summary data via Repositories only. No direct IndexedDB access,
// no business logic beyond simple counting/aggregation for display.

import { getAllMedicines } from '../db/medicinesRepo.js';
import { getAllSuppliers } from '../db/suppliersRepo.js';
import { getAllDeals } from '../db/dealsRepo.js';
import { getAllMessages } from '../db/whatsappRepo.js';
import { renderNav } from './nav.js';

/**
 * Fetches all data via repositories and computes dashboard summary figures.
 * Pure data step — no DOM access here, which keeps it independently testable.
 * @returns {Promise<object>} summary figures
 */
export function computeDashboardSummary() {
  return Promise.all([
    getAllMedicines(),
    getAllSuppliers(),
    getAllDeals(),
    getAllMessages(),
  ]).then(([medicines, suppliers, deals, messages]) => {
    const completedDeals = deals.filter((deal) => deal.status === 'completed');
    const totalProfit = completedDeals.reduce(
      (sum, deal) => sum + (typeof deal.profit === 'number' ? deal.profit : deal.sellPrice - deal.buyPrice),
      0
    );

    const whatsappCounts = messages.reduce((counts, message) => {
      const key = message.classification || 'unclassified';
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});

    return {
      medicinesCount: medicines.length,
      suppliersCount: suppliers.length,
      dealsCount: deals.length,
      completedDealsCount: completedDeals.length,
      totalProfit,
      whatsappCounts,
    };
  });
}

/**
 * Renders a computed summary into the DOM. Pure rendering step, decoupled
 * from data fetching so it can be tested with a stub document.
 * @param {object} summary - result of computeDashboardSummary()
 * @param {Document} doc - defaults to global document; overridable for tests
 */
export function renderDashboardSummary(summary, doc = document) {
  const setText = (id, value) => {
    const el = doc.getElementById(id);
    if (el) el.textContent = String(value);
  };

  setText('stat-medicines', summary.medicinesCount);
  setText('stat-suppliers', summary.suppliersCount);
  setText('stat-deals', summary.dealsCount);
  setText('stat-completed-deals', summary.completedDealsCount);
  setText('stat-profit', summary.totalProfit);

  const buyCount = summary.whatsappCounts.buy_request || 0;
  const sellCount = summary.whatsappCounts.sell_offer || 0;
  const unknownCount =
    (summary.whatsappCounts.unknown || 0) + (summary.whatsappCounts.unclassified || 0);

  setText('stat-whatsapp-buy', buyCount);
  setText('stat-whatsapp-sell', sellCount);
  setText('stat-whatsapp-unknown', unknownCount);
}

/**
 * Bootstraps the Dashboard screen: renders nav, shows a loading state,
 * fetches the summary, then renders it (or shows a clear error message).
 */
function initDashboard() {
  const navContainer = document.getElementById('app-nav');
  renderNav(navContainer, 'dashboard.html');

  const statusEl = document.getElementById('dashboard-status');
  if (statusEl) {
    statusEl.textContent = 'جاري تحميل البيانات...';
    statusEl.className = 'status-message loading';
  }

  computeDashboardSummary()
    .then((summary) => {
      renderDashboardSummary(summary);
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.className = '';
      }

      // Note: appStore.deals is populated by completeDeal() at the moment
      // a deal is created, not by Dashboard — Dashboard only reads from
      // repositories directly, so it never becomes a second writer of
      // state that belongs to the orchestrators.
    })
    .catch((err) => {
      if (statusEl) {
        statusEl.textContent = `تعذّر تحميل البيانات: ${err.message}`;
        statusEl.className = 'status-message error';
      }
    });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initDashboard);
}
