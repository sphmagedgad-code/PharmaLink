// src/ui/medicines.js
// PharmaLink OS — Medicines Screen (V1)
// Full CRUD wired to medicinesRepo.js only. No direct IndexedDB access.

import {
  addMedicine,
  updateMedicine,
  getAllMedicines,
  deleteMedicine,
} from '../db/medicinesRepo.js';
import { renderNav } from './nav.js';

let editingId = null;

/**
 * Generates a locally-unique id without relying on crypto.randomUUID(),
 * which is not guaranteed to be available on older Android WebViews.
 * @returns {string}
 */
function generateId() {
  return `med-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

/**
 * Reads and trims values out of the medicine form.
 * Pure function — no DOM side effects beyond reading .value.
 * @param {HTMLFormElement} form
 * @returns {object} raw field values (strings, possibly empty)
 */
export function collectMedicineFormValues(form) {
  const field = (name) => (form.elements[name] ? form.elements[name].value.trim() : '');
  return {
    name: field('name'),
    category: field('category'),
    unit: field('unit'),
    company: field('company'),
    barcode: field('barcode'),
    activeIngredient: field('activeIngredient'),
    notes: field('notes'),
  };
}

/**
 * Builds a full medicine record ready for addMedicine()/updateMedicine()
 * from form values, omitting empty optional fields rather than sending
 * empty strings (so validateMedicine's "non-empty if present" checks pass).
 * @param {object} values - result of collectMedicineFormValues()
 * @param {string|null} existingId - id to reuse when editing, null when creating
 * @param {string|null} existingCreatedAt - createdAt to preserve when editing
 * @returns {object}
 */
export function buildMedicineRecord(values, existingId, existingCreatedAt) {
  const now = new Date().toISOString();
  const record = {
    id: existingId || generateId(),
    name: values.name,
    category: values.category,
    unit: values.unit,
    createdAt: existingCreatedAt || now,
  };

  if (existingId) {
    record.updatedAt = now;
  }
  if (values.company) record.company = values.company;
  if (values.barcode) record.barcode = values.barcode;
  if (values.activeIngredient) record.activeIngredient = values.activeIngredient;
  if (values.notes) record.notes = values.notes;

  return record;
}

/**
 * Renders the medicines table into a container element.
 * Pure rendering function, decoupled from data fetching for testability.
 * @param {HTMLElement} container
 * @param {object[]} medicines
 */
export function renderMedicinesTable(container, medicines) {
  if (!container) return;

  if (medicines.length === 0) {
    container.innerHTML = '<p>لا توجد أدوية مسجّلة بعد.</p>';
    return;
  }

  const rows = medicines
    .map(
      (medicine) => `
        <tr>
          <td>${escapeHtml(medicine.name)}</td>
          <td>${escapeHtml(medicine.category)}</td>
          <td>${escapeHtml(medicine.unit)}</td>
          <td>${escapeHtml(medicine.company || '')}</td>
          <td>
            <button type="button" class="secondary-btn" data-action="edit" data-id="${escapeHtml(medicine.id)}">تعديل</button>
            <button type="button" class="secondary-btn" data-action="delete" data-id="${escapeHtml(medicine.id)}">حذف</button>
          </td>
        </tr>`
    )
    .join('');

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>الاسم</th>
          <th>الفئة</th>
          <th>الوحدة</th>
          <th>الشركة</th>
          <th>إجراءات</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/**
 * Minimal HTML escaping for values rendered via innerHTML.
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setStatus(statusEl, message, kind) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = kind ? `status-message ${kind}` : '';
}

function resetForm(form) {
  form.reset();
  editingId = null;
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'إضافة دواء';
  const cancelBtn = form.querySelector('[data-action="cancel-edit"]');
  if (cancelBtn) cancelBtn.hidden = true;
}

async function loadAndRenderMedicines(tableContainer, statusEl) {
  try {
    const medicines = await getAllMedicines();
    renderMedicinesTable(tableContainer, medicines);
    return medicines;
  } catch (err) {
    setStatus(statusEl, `تعذّر تحميل الأدوية: ${err.message}`, 'error');
    return [];
  }
}

function initMedicinesScreen() {
  const navContainer = document.getElementById('app-nav');
  renderNav(navContainer, 'medicines.html');

  const form = document.getElementById('medicine-form');
  const statusEl = document.getElementById('medicines-status');
  const tableContainer = document.getElementById('medicines-table-container');
  const cancelBtn = form ? form.querySelector('[data-action="cancel-edit"]') : null;

  let currentMedicines = [];

  const refresh = () => loadAndRenderMedicines(tableContainer, statusEl).then((medicines) => {
    currentMedicines = medicines;
  });

  refresh();

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus(statusEl, '', '');

      const values = collectMedicineFormValues(form);
      const existing = editingId ? currentMedicines.find((m) => m.id === editingId) : null;
      const record = buildMedicineRecord(
        values,
        editingId,
        existing ? existing.createdAt : null
      );

      try {
        if (editingId) {
          await updateMedicine(record);
          setStatus(statusEl, 'تم تحديث الدواء بنجاح.', 'loading');
        } else {
          await addMedicine(record);
          setStatus(statusEl, 'تم إضافة الدواء بنجاح.', 'loading');
        }
        resetForm(form);
        await refresh();
        setStatus(statusEl, '', '');
      } catch (err) {
        setStatus(statusEl, err.message, 'error');
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => resetForm(form));
  }

  if (tableContainer) {
    tableContainer.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;

      const id = button.getAttribute('data-id');
      const action = button.getAttribute('data-action');

      if (action === 'edit') {
        const medicine = currentMedicines.find((m) => m.id === id);
        if (!medicine || !form) return;
        editingId = id;
        form.elements.name.value = medicine.name || '';
        form.elements.category.value = medicine.category || '';
        form.elements.unit.value = medicine.unit || '';
        form.elements.company.value = medicine.company || '';
        form.elements.barcode.value = medicine.barcode || '';
        form.elements.activeIngredient.value = medicine.activeIngredient || '';
        form.elements.notes.value = medicine.notes || '';
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'حفظ التعديلات';
        if (cancelBtn) cancelBtn.hidden = false;
      }

      if (action === 'delete') {
        const confirmed = window.confirm('هل أنت متأكد من حذف هذا الدواء؟');
        if (!confirmed) return;
        try {
          await deleteMedicine(id);
          await refresh();
        } catch (err) {
          setStatus(statusEl, err.message, 'error');
        }
      }
    });
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initMedicinesScreen);
}
