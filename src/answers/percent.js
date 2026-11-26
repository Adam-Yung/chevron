import { formatNumber } from './format'
import { AMOUNT_SOURCE, normaliseQuery, parseAmount } from './query'

const N = `(${AMOUNT_SOURCE})`
const PCT = String.raw`\s*(?:%|percent|pct)`
// `<n>% of <m>` is also reachable as "what is 15% of 80" because normaliseQuery drops the filler.
const PERCENT_OF = new RegExp(`^${N}${PCT} of ${N}$`)
const PERCENT_OFF = new RegExp(`^${N}${PCT} off ${N}$`)
const IS_WHAT_PERCENT = new RegExp(`^${N} is what (?:percent|%|pct) of ${N}$`)
const WHAT_PERCENT_IS = new RegExp(`^what (?:percent|%|pct) of ${N} is ${N}$`)

const RULES = [
  { re: PERCENT_OF, label: (a, b) => `${a}% of ${b}`, value: (a, b) => (a * b) / 100, unit: '' },
  { re: PERCENT_OFF, label: (a, b) => `${b} less ${a}%`, value: (a, b) => b * (1 - a / 100), unit: '' },
  { re: IS_WHAT_PERCENT, label: (a, b) => `${a} of ${b}`, value: (a, b) => (a / b) * 100, unit: '%' },
  { re: WHAT_PERCENT_IS, label: (a, b) => `${b} of ${a}`, value: (a, b) => (b / a) * 100, unit: '%' },
]

/**
 * Percent phrases the calculator cannot express: `15% of 80`, `20% off 80`,
 * `20 is what percent of 80`, `what percent of 80 is 20`. `80 + 15%` lives in calculator.js.
 * @returns {import('./index').Answer|null}
 */
export function percentAnswer(query) {
  const q = normaliseQuery(query)
  for (const rule of RULES) {
    const m = rule.re.exec(q)
    if (!m) continue
    const a = parseAmount(m[1])
    const b = parseAmount(m[2])
    // The last two rules divide by their second operand.
    if (rule.unit && (rule.re === IS_WHAT_PERCENT ? b : a) === 0) return null
    const text = formatNumber(rule.value(a, b), 10)
    if (!text) return null
    return { suggestion: text + rule.unit, type: 'percent', relevance: 5000, label: rule.label(a, b) }
  }
  return null
}
