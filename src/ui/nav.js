// src/ui/nav.js
// PharmaLink OS — Shared Navigation Helper (V1)
// Pure DOM helper only. No repositories, no orchestrators, no IndexedDB.

const NAV_ITEMS = [
  { href: 'dashboard.html', label: 'الرئيسية' },
  { href: 'medicines.html', label: 'الأدوية' },
  { href: 'suppliers.html', label: 'الموردين' },
  { href: 'deals.html', label: 'الصفقات' },
  { href: 'whatsapp.html', label: 'واتساب' },
  { href: 'backup.html', label: 'نسخ احتياطي' },
  { href: 'settings.html', label: 'الإعدادات' },
];

/**
 * Renders the shared navigation bar into a container element and marks
 * the current page's link with aria-current="page".
 * @param {HTMLElement} container - the <nav> element to render into
 * @param {string} currentHref - filename of the current page, e.g. 'dashboard.html'
 */
export function renderNav(container, currentHref) {
  if (!container) return;

  container.innerHTML = '';
  NAV_ITEMS.forEach((item) => {
    const link = document.createElement('a');
    link.href = item.href;
    link.textContent = item.label;
    if (item.href === currentHref) {
      link.setAttribute('aria-current', 'page');
    }
    container.appendChild(link);
  });
}
