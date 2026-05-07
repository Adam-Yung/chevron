/**
 * Time / duration unit converter.
 * Parses queries like "2h in min", "90 minutes to hours", "1d in seconds".
 */

// Base unit: milliseconds
const UNITS = {
  ms:     { factor: 1,                    aliases: ['millisecond', 'milliseconds', 'millis'] },
  s:      { factor: 1000,                 aliases: ['second', 'seconds', 'sec', 'secs'] },
  min:    { factor: 60_000,               aliases: ['minute', 'minutes', 'mins'] },
  h:      { factor: 3_600_000,            aliases: ['hour', 'hours', 'hr', 'hrs'] },
  d:      { factor: 86_400_000,           aliases: ['day', 'days'] },
  w:      { factor: 604_800_000,          aliases: ['week', 'weeks', 'wk', 'wks'] },
  month:  { factor: 2_629_800_000,        aliases: ['months', 'mo', 'mos'] },  // avg 30.4375 days
  yr:     { factor: 31_557_600_000,       aliases: ['year', 'years', 'y'] },   // avg 365.25 days
}

// Build a flat alias → canonical-key map
const ALIAS_MAP = new Map()
for (const [key, { aliases }] of Object.entries(UNITS)) {
  ALIAS_MAP.set(key, key)
  for (const alias of aliases) ALIAS_MAP.set(alias.toLowerCase(), key)
}

// Regex: <number> <unit> (in|to) <unit>
// e.g. "2h in min", "90 minutes to hours", "1.5 days in seconds"
const TIME_RE = /^([+-]?(?:\d+\.?\d*|\.\d+))\s*([a-z]+)\s+(?:in|to)\s+([a-z]+)\s*$/i

/**
 * Attempts to parse and convert a time/duration query.
 * @param {string} query
 * @returns {{ result: number, fromUnit: string, toUnit: string }|null}
 */
export function convertTime(query) {
  const m = query.trim().match(TIME_RE)
  if (!m) return null

  const amount  = parseFloat(m[1])
  const fromKey = ALIAS_MAP.get(m[2].trim().toLowerCase())
  const toKey   = ALIAS_MAP.get(m[3].trim().toLowerCase())

  if (!fromKey || !toKey || !isFinite(amount)) return null

  const inMs   = amount * UNITS[fromKey].factor
  const result = inMs / UNITS[toKey].factor

  if (!isFinite(result)) return null

  return { result, fromUnit: fromKey, toUnit: toKey }
}

/**
 * Formats a time conversion result.
 */
export function formatTimeResult(result, toUnit) {
  const rounded = parseFloat(result.toPrecision(6))
  return `${rounded} ${toUnit}`
}
