import { normaliseQuery } from './query'

const MAX_DIGITS = 40
const NAMED_BASES = { hex: 16, hexadecimal: 16, bin: 2, binary: 2, oct: 8, octal: 8, dec: 10, decimal: 10 }
const PREFIX_BASE = { '0x': 16, '0b': 2, '0o': 8 }
const BASE_NAMES = { 2: 'binary', 8: 'octal', 10: 'decimal', 16: 'hex' }
const PREFIX = { 2: '0b', 8: '0o', 16: '0x' }
const SOURCE = /^(-?)(0x[0-9a-f]+|0b[01]+|0o[0-7]+|\d+)$/
const BASE_RE = /^(\S+) (?:in|to|into|as) (?:(hex|hexadecimal|bin|binary|oct|octal|dec|decimal)|base (\d{1,2}))$/

function parseSource(text) {
  const m = SOURCE.exec(text)
  if (!m || m[2].length > MAX_DIGITS) return null
  const base = PREFIX_BASE[m[2].slice(0, 2)] ?? 10
  const value = BigInt(m[2])
  return { value: m[1] ? -value : value, base }
}

function render(value, base) {
  const sign = value < 0n ? '-' : ''
  const digits = (value < 0n ? -value : value).toString(base)
  return sign + (PREFIX[base] ?? '') + digits
}

/**
 * Integer base conversion: `255 in hex`, `0xff to decimal`, `0b1010 in dec`, `255 to base 7`.
 * Plain digits are always read as decimal (never guessing that `ff` is hex).
 * Hex, binary and octal results carry their 0x / 0b / 0o prefix so they stay unambiguous when pasted.
 * @returns {import('./index').Answer|null}
 */
export function baseAnswer(query) {
  const m = BASE_RE.exec(normaliseQuery(query))
  if (!m) return null
  const source = parseSource(m[1])
  const target = m[3] ? Number(m[3]) : NAMED_BASES[m[2]]
  if (!source || target < 2 || target > 36 || source.base === target) return null
  return {
    suggestion: render(source.value, target),
    type: 'base',
    relevance: 5000,
    label: `${m[1]} (${BASE_NAMES[source.base] ?? `base ${source.base}`})`,
  }
}
