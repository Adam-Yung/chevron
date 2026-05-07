/**
 * Weight / mass unit converter.
 * Parses queries like "100kg in lb", "5 ounces to grams", "2 stone in kg".
 */

// Base unit: grams
const UNITS = {
  // metric
  mg:          { factor: 0.001,       aliases: ['milligram', 'milligrams'] },
  g:           { factor: 1,           aliases: ['gram', 'grams', 'gramme', 'grammes'] },
  kg:          { factor: 1000,        aliases: ['kilogram', 'kilograms', 'kilogramme', 'kilogrammes'] },
  t:           { factor: 1_000_000,   aliases: ['tonne', 'tonnes', 'metric ton', 'metric tons', 'metricton', 'metrictons'] },
  // imperial
  oz:          { factor: 28.3495,     aliases: ['ounce', 'ounces'] },
  lb:          { factor: 453.592,     aliases: ['pound', 'pounds', 'lbs'] },
  st:          { factor: 6350.29,     aliases: ['stone', 'stones'] },
  // us
  'short ton': { factor: 907185,      aliases: ['shortton', 'short tons', 'us ton', 'us tons', 'uston', 'ustons', 'ton', 'tons'] },
}

// Build a flat alias → canonical-key map
const ALIAS_MAP = new Map()
for (const [key, { aliases }] of Object.entries(UNITS)) {
  ALIAS_MAP.set(key, key)
  for (const alias of aliases) ALIAS_MAP.set(alias.toLowerCase(), key)
}

// Regex: <number> <unit> (in|to) <unit>
// e.g. "100 kg in lb", "5ounces to grams", "2.5 lb to kg"
const WEIGHT_RE = /^([+-]?(?:\d+\.?\d*|\.\d+))\s*([a-z][a-z ]*?)\s+(?:in|to)\s+([a-z][a-z ]*?)\s*$/i

/**
 * Attempts to parse and convert a weight query.
 * @param {string} query
 * @returns {{ result: number, fromUnit: string, toUnit: string }|null}
 */
export function convertWeight(query) {
  const m = query.trim().match(WEIGHT_RE)
  if (!m) return null

  const amount = parseFloat(m[1])
  const fromKey = ALIAS_MAP.get(m[2].trim().toLowerCase())
  const toKey   = ALIAS_MAP.get(m[3].trim().toLowerCase())

  if (!fromKey || !toKey || !isFinite(amount)) return null

  const inGrams  = amount * UNITS[fromKey].factor
  const result   = inGrams / UNITS[toKey].factor

  if (!isFinite(result)) return null

  return { result, fromUnit: fromKey, toUnit: toKey }
}

/**
 * Formats a weight conversion result.
 */
export function formatWeightResult(result, toUnit) {
  const rounded = parseFloat(result.toPrecision(6))
  return `${rounded} ${toUnit}`
}
