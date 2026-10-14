/**
 * @file code.js
 * Expedition Code parser, formatter, and seed utilities.
 * Format: v1/<rows>x<cols>/<gen>/<seed>/b<braidPct>/t<terrainPct>/<difficulty>
 */

const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Generates an 8-character Crockford base32 seed.
 * @param {import('../structures/rng.js').Rng} [rng]
 * @returns {string}
 */
export function randomSeed(rng) {
  let s = '';
  for (let i = 0; i < 8; i++) {
    const idx = rng ? rng.int(32) : Math.floor(Math.random() * 32);
    s += CROCKFORD_ALPHABET[idx];
  }
  return s;
}

/**
 * Formats an Expedition Code string.
 * @param {object} params
 * @param {string} [params.version='v1']
 * @param {number} params.rows
 * @param {number} params.cols
 * @param {string} params.generator 'bkt' | 'prm' | 'krk' | 'wil' | 'div'
 * @param {string} params.seed
 * @param {number} [params.braidPct=0]
 * @param {number} [params.terrainPct=0]
 * @param {string} [params.difficulty] 'scn' | 'srv' | 'pth' | 'nmr'
 * @returns {string}
 */
export function formatCode({
  version = 'v1',
  rows,
  cols,
  generator,
  seed,
  braidPct = 0,
  terrainPct = 0,
  difficulty = '',
}) {
  const parts = [
    version,
    `${rows}x${cols}`,
    generator,
    seed,
    `b${Math.round(braidPct)}`,
    `t${Math.round(terrainPct)}`,
  ];
  if (difficulty) {
    parts.push(difficulty);
  }
  return parts.join('/');
}

/**
 * Parses an Expedition Code string.
 * @param {string} code
 * @returns {object}
 */
export function parseCode(code) {
  if (typeof code !== 'string') {
    throw new Error('Expedition code must be a string');
  }
  const parts = code.trim().split('/');
  if (parts.length < 6 || parts.length > 7) {
    throw new Error(`Invalid expedition code segment count: expected 6 or 7, got ${parts.length}`);
  }

  const [version, dims, gen, seed, bPart, tPart, diff] = parts;

  if (version !== 'v1') {
    throw new Error(`Unsupported engine version: ${version}`);
  }

  const dimMatch = dims.match(/^(\d+)x(\d+)$/);
  if (!dimMatch) {
    throw new Error(`Invalid dimensions format: ${dims}`);
  }
  const rows = parseInt(dimMatch[1], 10);
  const cols = parseInt(dimMatch[2], 10);
  if (rows < 2 || rows > 100 || cols < 2 || cols > 100) {
    throw new Error(`Dimensions out of range (2-100): ${rows}x${cols}`);
  }

  const VALID_GENS = ['bkt', 'prm', 'krk', 'wil', 'div'];
  if (!VALID_GENS.includes(gen)) {
    throw new Error(`Unknown generator: ${gen}`);
  }

  if (!seed || seed.length < 1 || seed.length > 64) {
    throw new Error(`Invalid seed string length: ${seed}`);
  }

  if (!bPart.startsWith('b')) {
    throw new Error(`Invalid braid format: ${bPart}`);
  }
  const braidPct = parseInt(bPart.slice(1), 10);
  if (isNaN(braidPct) || braidPct < 0 || braidPct > 100) {
    throw new Error(`Braid percent out of range (0-100): ${bPart}`);
  }

  if (!tPart.startsWith('t')) {
    throw new Error(`Invalid terrain format: ${tPart}`);
  }
  const terrainPct = parseInt(tPart.slice(1), 10);
  if (isNaN(terrainPct) || terrainPct < 0 || terrainPct > 100) {
    throw new Error(`Terrain percent out of range (0-100): ${tPart}`);
  }

  let difficulty = null;
  if (diff) {
    const VALID_DIFF = ['scn', 'srv', 'pth', 'nmr'];
    if (!VALID_DIFF.includes(diff)) {
      throw new Error(`Unknown difficulty code: ${diff}`);
    }
    difficulty = diff;
  }

  return {
    version,
    rows,
    cols,
    generator: gen,
    seed,
    braidPct,
    terrainPct,
    difficulty,
  };
}
