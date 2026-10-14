/**
 * @file event_log.js
 * Linear event history log supporting bidirectional scrubbing.
 */

export class EventLog {
  constructor() {
    this._events = [];
    this._cursor = 0;
  }

  /**
   * Appends an event to the log.
   * @param {object} event
   */
  push(event) {
    this._events.push(event);
    this._cursor = this._events.length;
  }

  /**
   * Clears the event log.
   */
  clear() {
    this._events.length = 0;
    this._cursor = 0;
  }

  /**
   * Total events logged.
   * @returns {number}
   */
  get length() {
    return this._events.length;
  }

  /**
   * Current scrubbing position (0 <= cursor <= length).
   * @returns {number}
   */
  get cursor() {
    return this._cursor;
  }

  /**
   * Sets scrubbing cursor position.
   * @param {number} idx
   */
  seek(idx) {
    this._cursor = Math.max(0, Math.min(this._events.length, idx));
  }

  /**
   * Returns event at index.
   * @param {number} idx
   * @returns {object}
   */
  get(idx) {
    return this._events[idx];
  }

  /**
   * Returns slice of events up to cursor.
   * @returns {Array<object>}
   */
  eventsUpToCursor() {
    return this._events.slice(0, this._cursor);
  }

  /**
   * All events.
   * @returns {Array<object>}
   */
  all() {
    return this._events;
  }
}
