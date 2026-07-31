// src/db/whatsappRepo.js
// PharmaLink CRM — WhatsApp Messages Repository (V1 — Frozen Architecture)
// Vanilla IndexedDB. CRUD only. No classification logic here.

import { openDatabase } from './connection.js';
import { STORE_NAMES } from './schema.js';
import { validateWhatsAppMessage } from '../lib/validation/schemaGuards.js';

const STORE = STORE_NAMES.WHATSAPP_MESSAGES;

export function addMessage(message) {
  const { valid, errors } = validateWhatsAppMessage(message);
  if (!valid) {
    return Promise.reject(new Error(`Invalid message: ${errors.join(', ')}`));
  }
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const request = tx.objectStore(STORE).add(message);
      request.onsuccess = () => resolve(message.id);
      request.onerror = () =>
        reject(request.error || new Error('Failed to add message.'));
    });
  });
}

export function updateMessage(message) {
  const { valid, errors } = validateWhatsAppMessage(message);
  if (!valid) {
    return Promise.reject(new Error(`Invalid message: ${errors.join(', ')}`));
  }
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const request = tx.objectStore(STORE).put(message);
      request.onsuccess = () => resolve(message.id);
      request.onerror = () =>
        reject(request.error || new Error('Failed to update message.'));
    });
  });
}

export function getMessageById(id) {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error || new Error('Failed to get message.'));
    });
  });
}

export function getAllMessages() {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () =>
        reject(request.error || new Error('Failed to get all messages.'));
    });
  });
}

export function deleteMessage(id) {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const request = tx.objectStore(STORE).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error || new Error('Failed to delete message.'));
    });
  });
}
