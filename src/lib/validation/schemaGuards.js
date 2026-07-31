// src/lib/validation/schemaGuards.js
// PharmaLink CRM — Schema Guards (V1 — Frozen Architecture)
// Pure validation functions. No IndexedDB access. No side effects. No external libraries.

// ---------------------------------------------------------------------------
// Helper predicates
// ---------------------------------------------------------------------------

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isPositiveNumber(value) {
  return isNumber(value) && value > 0;
}

export function isBoolean(value) {
  return typeof value === 'boolean';
}

export function isArray(value) {
  return Array.isArray(value);
}

export function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isISODateString(value) {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

// ---------------------------------------------------------------------------
// Field-level allow-lists
// ---------------------------------------------------------------------------

const SUPPLIER_TRUST_LEVELS = ['low', 'medium', 'high'];
const SUPPLIER_STATUSES = ['active', 'inactive', 'blacklisted'];
const DEAL_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const DEAL_PAYMENT_STATUSES = ['unpaid', 'partial', 'paid'];

// ---------------------------------------------------------------------------
// validateMedicine
// ---------------------------------------------------------------------------

export function validateMedicine(medicine) {
  const errors = [];

  if (!isObject(medicine)) {
    return { valid: false, errors: ['medicine يجب أن يكون Object.'] };
  }

  if (!isNonEmptyString(medicine.id)) errors.push('id مطلوب ويجب أن يكون نص غير فارغ.');
  if (!isNonEmptyString(medicine.name)) errors.push('name مطلوب ويجب أن يكون نص غير فارغ.');
  if (!isNonEmptyString(medicine.category)) errors.push('category مطلوب ويجب أن يكون نص غير فارغ.');
  if (!isNonEmptyString(medicine.unit)) errors.push('unit مطلوب ويجب أن يكون نص غير فارغ.');
  if (!isISODateString(medicine.createdAt)) errors.push('createdAt مطلوب ويجب أن يكون تاريخ ISO صالح.');

  if (medicine.company !== undefined && !isNonEmptyString(medicine.company)) {
    errors.push('company يجب أن يكون نص غير فارغ إذا وُجد.');
  }
  if (medicine.barcode !== undefined && !isNonEmptyString(medicine.barcode)) {
    errors.push('barcode يجب أن يكون نص غير فارغ إذا وُجد.');
  }
  if (medicine.activeIngredient !== undefined && !isNonEmptyString(medicine.activeIngredient)) {
    errors.push('activeIngredient يجب أن يكون نص غير فارغ إذا وُجد.');
  }
  if (medicine.notes !== undefined && typeof medicine.notes !== 'string') {
    errors.push('notes يجب أن يكون نص إذا وُجد.');
  }
  if (medicine.updatedAt !== undefined && !isISODateString(medicine.updatedAt)) {
    errors.push('updatedAt يجب أن يكون تاريخ ISO صالح إذا وُجد.');
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// validateSupplier
// ---------------------------------------------------------------------------

export function validateSupplier(supplier) {
  const errors = [];

  if (!isObject(supplier)) {
    return { valid: false, errors: ['supplier يجب أن يكون Object.'] };
  }

  if (!isNonEmptyString(supplier.id)) errors.push('id مطلوب ويجب أن يكون نص غير فارغ.');
  if (!isNonEmptyString(supplier.name)) errors.push('name مطلوب ويجب أن يكون نص غير فارغ.');
  if (!isNonEmptyString(supplier.phone)) errors.push('phone مطلوب ويجب أن يكون نص غير فارغ.');

  if (supplier.whatsapp !== undefined && !isNonEmptyString(supplier.whatsapp)) {
    errors.push('whatsapp يجب أن يكون نص غير فارغ إذا وُجد.');
  }
  if (supplier.address !== undefined && !isNonEmptyString(supplier.address)) {
    errors.push('address يجب أن يكون نص غير فارغ إذا وُجد.');
  }
  if (supplier.governorate !== undefined && !isNonEmptyString(supplier.governorate)) {
    errors.push('governorate يجب أن يكون نص غير فارغ إذا وُجد.');
  }
  if (supplier.notes !== undefined && typeof supplier.notes !== 'string') {
    errors.push('notes يجب أن يكون نص إذا وُجد.');
  }
  if (supplier.trustLevel !== undefined && !SUPPLIER_TRUST_LEVELS.includes(supplier.trustLevel)) {
    errors.push(`trustLevel يجب أن يكون واحدة من: ${SUPPLIER_TRUST_LEVELS.join(', ')}.`);
  }
  if (supplier.status !== undefined && !SUPPLIER_STATUSES.includes(supplier.status)) {
    errors.push(`status يجب أن يكون واحدة من: ${SUPPLIER_STATUSES.join(', ')}.`);
  }

  if (supplier.lastPrices !== undefined) {
    if (!isObject(supplier.lastPrices)) {
      errors.push('lastPrices يجب أن يكون Object.');
    } else {
      for (const medicineId of Object.keys(supplier.lastPrices)) {
        const entry = supplier.lastPrices[medicineId];
        if (!isObject(entry)) {
          errors.push(`lastPrices["${medicineId}"] يجب أن يكون Object.`);
          continue;
        }
        if (!isPositiveNumber(entry.price)) {
          errors.push(`lastPrices["${medicineId}"].price يجب أن يكون رقم موجب.`);
        }
        if (!isISODateString(entry.date)) {
          errors.push(`lastPrices["${medicineId}"].date يجب أن يكون تاريخ ISO صالح.`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// validateDeal
// ---------------------------------------------------------------------------

export function validateDeal(deal) {
  const errors = [];

  if (!isObject(deal)) {
    return { valid: false, errors: ['deal يجب أن يكون Object.'] };
  }

  if (!isNonEmptyString(deal.id)) errors.push('id مطلوب ويجب أن يكون نص غير فارغ.');
  if (!isNonEmptyString(deal.medicineId)) errors.push('medicineId مطلوب ويجب أن يكون نص غير فارغ.');
  if (!isNonEmptyString(deal.supplierId)) errors.push('supplierId مطلوب ويجب أن يكون نص غير فارغ.');
  if (!isNonEmptyString(deal.buyerId)) errors.push('buyerId مطلوب ويجب أن يكون نص غير فارغ.');
  if (!isPositiveNumber(deal.quantity)) errors.push('quantity مطلوب ويجب أن يكون رقم موجب.');
  if (!isPositiveNumber(deal.buyPrice)) errors.push('buyPrice مطلوب ويجب أن يكون رقم موجب.');
  if (!isPositiveNumber(deal.sellPrice)) errors.push('sellPrice مطلوب ويجب أن يكون رقم موجب.');
  if (!isNonEmptyString(deal.status) || !DEAL_STATUSES.includes(deal.status)) {
    errors.push(`status مطلوب ويجب أن يكون واحدة من: ${DEAL_STATUSES.join(', ')}.`);
  }
  if (!isISODateString(deal.createdAt)) errors.push('createdAt مطلوب ويجب أن يكون تاريخ ISO صالح.');

  if (deal.profit !== undefined && !isNumber(deal.profit)) {
    errors.push('profit يجب أن يكون رقم إذا وُجد.');
  }
  if (deal.paymentStatus !== undefined && !DEAL_PAYMENT_STATUSES.includes(deal.paymentStatus)) {
    errors.push(`paymentStatus يجب أن يكون واحدة من: ${DEAL_PAYMENT_STATUSES.join(', ')}.`);
  }
  if (deal.updatedAt !== undefined && !isISODateString(deal.updatedAt)) {
    errors.push('updatedAt يجب أن يكون تاريخ ISO صالح إذا وُجد.');
  }
  if (deal.notes !== undefined && typeof deal.notes !== 'string') {
    errors.push('notes يجب أن يكون نص إذا وُجد.');
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// validateWhatsAppMessage
// ---------------------------------------------------------------------------

export function validateWhatsAppMessage(message) {
  const errors = [];

  if (!isObject(message)) {
    return { valid: false, errors: ['message يجب أن يكون Object.'] };
  }

  if (!isNonEmptyString(message.id)) errors.push('id مطلوب ويجب أن يكون نص غير فارغ.');
  if (!isNonEmptyString(message.groupId)) errors.push('groupId مطلوب ويجب أن يكون نص غير فارغ.');
  if (!isISODateString(message.receivedAt)) errors.push('receivedAt مطلوب ويجب أن يكون تاريخ ISO صالح.');
  if (message.classification !== undefined && !isNonEmptyString(message.classification)) {
    errors.push('classification يجب أن يكون نص غير فارغ إذا وُجد.');
  }

  return { valid: errors.length === 0, errors };
}
