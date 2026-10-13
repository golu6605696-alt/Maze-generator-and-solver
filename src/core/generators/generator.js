/**
 * @file generator.js
 * Abstract base class defining the contract for all maze generator algorithms.
 * Every generator mutates the given grid into a maze and returns an array of Step animation events.
 *
 * Complexity: Interface definition, O(1).
 */

export class Generator {
  /**
   * @param {string} name - Human-readable algorithm identifier
   */
  constructor(name) {
    if (new.target === Generator) {
      throw new TypeError('Cannot instantiate abstract class Generator directly');
    }
    if (typeof name !== 'string' || !name.trim()) {
      throw new TypeError('Generator name must be a non-empty string');
    }
    this.name = name;
  }

  /**
   * Generates a maze on the provided grid.
   * Mutates grid walls and returns animation step records.
   *
   * @abstract
   * @param {import('../grid.js').Grid} grid
   * @param {import('../../structures/rng.js').SeededRNG} [rng]
   * @returns {import('../step.js').Step[]}
   */
  generate(grid, rng) {
    throw new Error(`generate() not implemented on ${this.constructor.name}`);
  }
}
