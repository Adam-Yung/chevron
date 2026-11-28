import { formatNumber } from '../format'
import { AMOUNT_SOURCE, normaliseQuery, parseAmount } from '../query'
import { FAMILIES } from './tables'

const UNIT = String.raw`[a-z°][a-z0-9°²³/^. ]*?`
const CONVERT_RE = new RegExp(`^([+-]?(?:${AMOUNT_SOURCE})) ?(${UNIT}) (?:in|to|into|as) ([a-z°][a-z0-9°²³/^. ]*)$`)
// Smallest absolute temperature in celsius; colder queries are nonsense, not answers.
const ABSOLUTE_ZERO_C = -273.15

/** alias -> [{ family, key }]; one alias can exist in several families (`m` is only length, `pt` only volume). */
const ALIASES = new Map()
for (const [family, { units }] of Object.entries(FAMILIES)) {
  for (const [key, unit] of Object.entries(units)) {
    for (const alias of [key, ...unit.aliases]) {
      const name = normaliseUnit(alias)
      ALIASES.set(name, [...(ALIASES.get(name) ?? []), { family, key }])
    }
  }
}

function normaliseUnit(text) {
  return text.toLowerCase().replace(/²/g, '2').replace(/\^2/g, '2').replace(/\./g, '').replace(/ +/g, ' ').trim()
}

function toBase(unit, value) {
  return unit.factor === undefined ? unit.toBase(value) : value * unit.factor
}

function fromBase(unit, value) {
  return unit.factor === undefined ? unit.fromBase(value) : value / unit.factor
}

function resolvePair(fromText, toText) {
  const fromHits = ALIASES.get(normaliseUnit(fromText)) ?? []
  const toHits = ALIASES.get(normaliseUnit(toText)) ?? []
  for (const from of fromHits) {
    const to = toHits.find(hit => hit.family === from.family)
    if (to) return { family: from.family, from: from.key, to: to.key }
  }
  return null
}

/** Parses `<amount> <unit> in|to <unit>` and converts within one family; null when it cannot. */
export function convertUnits(query) {
  const m = CONVERT_RE.exec(normaliseQuery(query))
  if (!m) return null
  const pair = resolvePair(m[2], m[3])
  const amount = parseAmount(m[1])
  if (!pair || !Number.isFinite(amount)) return null
  const { units } = FAMILIES[pair.family]
  const base = toBase(units[pair.from], amount)
  if (pair.family === 'temperature' && base < ABSOLUTE_ZERO_C) return null
  const result = fromBase(units[pair.to], base)
  if (!Number.isFinite(result)) return null
  return { result, amount, family: pair.family, fromUnit: pair.from, toUnit: pair.to }
}

/** The unit answer card; a query without a target unit gets none. @returns {import('../index').Answer|null} */
export function unitAnswer(query) {
  const c = convertUnits(query)
  if (!c) return null
  return {
    suggestion: `${formatNumber(c.result)} ${c.toUnit}`,
    type: 'unit',
    relevance: 5000,
    label: `${formatNumber(c.amount)} ${c.fromUnit}`,
  }
}
