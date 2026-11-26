const MAX_QUERY_LENGTH = 120
const LEADING_FILLER = /^(?:what(?:'s| is)|calculate|calc|compute|convert|how much is)\s+/
const TRAILING_FILLER = /\s*[?=]+$/
const AMOUNT = String.raw`(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|\.\d+`

/** Source of a regex fragment matching an unsigned amount; commas allowed as thousands separators. */
export const AMOUNT_SOURCE = AMOUNT

/**
 * Canonical form every answer module matches against: lower case, single spaces, question
 * words and a trailing `?`/`=` removed. Returns '' for queries too long or multi-line to be
 * an instant question, so each module can bail out on a falsy value.
 * @param {string} query
 * @returns {string}
 */
export function normaliseQuery(query) {
  if (typeof query !== 'string' || query.length > MAX_QUERY_LENGTH * 2) return ''
  const flat = query.trim().toLowerCase()
  if (flat.includes('\n')) return ''
  const q = flat.replace(/\s+/g, ' ').replace(LEADING_FILLER, '').replace(TRAILING_FILLER, '')
  return q.length > MAX_QUERY_LENGTH ? '' : q
}

/** Parses an amount captured with {@link AMOUNT_SOURCE}. */
export function parseAmount(text) {
  return Number.parseFloat(text.replace(/,/g, ''))
}
