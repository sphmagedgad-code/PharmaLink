// src/state/orchestrators/classifyWhatsAppMessage.js
// PharmaLink CRM — Classify WhatsApp Message Orchestrator (V1 — Frozen Architecture)
// Responsible ONLY for classifying a pasted WhatsApp message and persisting it.
// Rule-based keyword matching only — no AI API, no external service calls.
// Uses whatsappRepo for persistence and appStore for state updates only.
// Never touches IndexedDB directly.

import { addMessage } from '../../db/whatsappRepo.js';
import { getState, setState } from '../appStore.js';

const CLASSIFICATION = Object.freeze({
  BUY_REQUEST: 'buy_request',
  SELL_OFFER: 'sell_offer',
  UNKNOWN: 'unknown',
});

// Keyword lists kept simple and local — pattern-level matching only,
// no scoring model, no external dictionary.
const BUY_KEYWORDS = [
  'مطلوب',
  'محتاج',
  'عايز',
  'ابحث عن',
  'need',
  'looking for',
  'want to buy',
  'wanted',
];

const SELL_KEYWORDS = [
  'متوفر',
  'للبيع',
  'عرض',
  'متاح',
  'available',
  'for sale',
  'offer',
  'in stock',
];

/**
 * Determines the classification label for raw message text using
 * simple keyword matching (case-insensitive). Buy keywords are checked
 * first, since a message can plausibly contain both ("available, who
 * needs X") and a buy signal should not be masked by a sell keyword.
 * @param {string} content
 * @returns {string} one of CLASSIFICATION values
 */
function detectClassification(content) {
  const normalized = content.toLowerCase();

  const hasBuyKeyword = BUY_KEYWORDS.some((keyword) => normalized.includes(keyword));
  if (hasBuyKeyword) return CLASSIFICATION.BUY_REQUEST;

  const hasSellKeyword = SELL_KEYWORDS.some((keyword) => normalized.includes(keyword));
  if (hasSellKeyword) return CLASSIFICATION.SELL_OFFER;

  return CLASSIFICATION.UNKNOWN;
}

/**
 * Classifies a pasted WhatsApp message and persists it via whatsappRepo.
 * Updates appStore only with a running count per classification —
 * not the full message list, to avoid unbounded memory growth in-session.
 *
 * @param {object} message - must include: id, groupId, receivedAt, content
 *   (content is the raw pasted message text used for classification;
 *   it is not enforced by validateWhatsAppMessage but is required here
 *   to perform classification)
 * @returns {Promise<object>} the persisted message, including classification
 */
export function classifyWhatsAppMessage(message) {
  if (!message || typeof message !== 'object') {
    return Promise.reject(new Error('message must be an object.'));
  }
  if (typeof message.content !== 'string' || message.content.trim().length === 0) {
    return Promise.reject(new Error('message.content is required and must be a non-empty string.'));
  }

  const classification = detectClassification(message.content);
  const classifiedMessage = { ...message, classification };

  return addMessage(classifiedMessage).then(() => {
    const currentCounts = getState().whatsappClassificationCounts || {};
    setState({
      whatsappClassificationCounts: {
        ...currentCounts,
        [classification]: (currentCounts[classification] || 0) + 1,
      },
    });

    return classifiedMessage;
  });
}

export { CLASSIFICATION };
