import { baseAnswer } from './bases'
import { calculatorAnswer } from './calculator'
import { percentAnswer } from './percent'
import { timezoneAnswer } from './timezones'
import { unitAnswer } from './units'

/**
 * @typedef {object} Answer
 * @property {string} suggestion shown, and copied on Enter
 * @property {string} type one of ANSWER_TYPES
 * @property {number} relevance 5000 for exact answers
 * @property {string} [label] short caption, e.g. `1 EUR = 1.0834 USD`
 */

export { currencyAnswer, looksLikeCurrency } from './currency'

/** Every `type` this module produces; the app copies these on Enter instead of searching. */
export const ANSWER_TYPES = ['calculator', 'percent', 'unit', 'base', 'timezone', 'currency']

// Order only matters for display when two families match one query, which the grammars avoid.
const FAMILIES = [percentAnswer, baseAnswer, unitAnswer, timezoneAnswer, calculatorAnswer]

/**
 * Every offline answer for a query: calculator, percent, units, number bases, time zones.
 * Synchronous and pure (time zones read the clock); never throws.
 * Currency needs the network, see `currencyAnswer`.
 * @param {string} query
 * @param {{ now?: () => number }} [options]
 * @returns {Answer[]}
 */
export function instantAnswers(query, options) {
  const answers = []
  for (const family of FAMILIES) {
    try {
      const answer = family(query, options)
      if (answer) answers.push(answer)
    } catch {
      // One broken family must not take the search box down with it.
    }
  }
  return answers
}
