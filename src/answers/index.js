import { baseAnswer } from './bases'
import { calculatorAnswer } from './calculator'
import { percentAnswer } from './percent'
import { timezoneAnswer } from './timezones'
import { unitAnswer } from './units'

/** @typedef {{ suggestion: string, type: string, relevance: number, label?: string }} Answer */

export { currencyAnswer, looksLikeCurrency } from './currency'

/** Every `type` this module produces; the app copies these on Enter instead of searching. */
export const ANSWER_TYPES = ['calculator', 'percent', 'unit', 'base', 'timezone', 'currency']

// Order only matters for display when two families match one query, which the grammars avoid.
const FAMILIES = [percentAnswer, baseAnswer, unitAnswer, timezoneAnswer, calculatorAnswer]

/** Every offline answer for a query. Synchronous and never throws; currency needs the network, see `currencyAnswer`. */
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
