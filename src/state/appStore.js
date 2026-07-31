// src/state/appStore.js
// PharmaLink CRM — Application State Store (V1 — Frozen Architecture)
// Plain in-memory state with subscribe/setState/getState. No IndexedDB access here.
// This module is a mediator only: Orchestrators read/write state through it,
// and Orchestrators (not this file) call the Repositories for persistence.
// No React, no external libraries, no UI code.

let state = {};
const listeners = new Set();

/**
 * Returns the current state object.
 * Callers must treat the returned reference as read-only;
 * use setState() to make changes so subscribers are notified.
 * @returns {object}
 */
export function getState() {
  return state;
}

/**
 * Merges a partial update into the current state (shallow merge)
 * and notifies all subscribers synchronously.
 * @param {object} partialState - keys to merge into the current state
 */
export function setState(partialState) {
  if (typeof partialState !== 'object' || partialState === null) {
    throw new Error('setState requires a plain object.');
  }

  state = { ...state, ...partialState };
  listeners.forEach((listener) => listener(state));
}

/**
 * Registers a listener called with the full state on every setState().
 * @param {(state: object) => void} listener
 * @returns {() => void} unsubscribe function
 */
export function subscribe(listener) {
  if (typeof listener !== 'function') {
    throw new Error('subscribe requires a function.');
  }

  listeners.add(listener);
  return () => unsubscribe(listener);
}

/**
 * Removes a previously registered listener.
 * @param {(state: object) => void} listener
 */
export function unsubscribe(listener) {
  listeners.delete(listener);
}
