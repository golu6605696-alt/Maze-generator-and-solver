/**
 * @file iter.js
 * Generator iteration and stepping utilities.
 */

/**
 * Runs a generator to completion and returns its final return value.
 * @template T, R
 * @param {Generator<T, R, void>} it
 * @returns {R}
 */
export function drain(it) {
  let res = it.next();
  while (!res.done) {
    res = it.next();
  }
  return res.value;
}

/**
 * Pulls up to `n` items from a generator, invoking `sink(item)` for each.
 * @template T, R
 * @param {Generator<T, R, void>} it
 * @param {number} n Maximum events to pull.
 * @param {(event: T) => void} [sink] Optional sink callback for each event.
 * @returns {{ done: boolean, value?: R }}
 */
export function takeSteps(it, n, sink) {
  let count = 0;
  while (count < n) {
    const res = it.next();
    if (res.done) {
      return { done: true, value: res.value };
    }
    if (sink) sink(res.value);
    count++;
  }
  return { done: false };
}
