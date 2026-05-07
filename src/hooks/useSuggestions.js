import { useState, useCallback, useRef, useEffect, useContext } from 'react'
import { SettingsContext } from '../contexts/Settings'
import History from '../classes/localStorage/history'
import copyObj from '../functions/dataUtils/copyObj'
import currencyCodes from '../currencies'
import { calculate, formatCalcResult } from '../functions/engineUtils/calculator'
import { convertWeight, formatWeightResult } from '../functions/engineUtils/weightConverter'
import { convertTime, formatTimeResult } from '../functions/engineUtils/timeConverter'

const HIGHEST_RELEVANCE = 5000
// the hierarchy of suggestion types: the lower index - the more higher in the hierarchy
const hierarchy = ['calculator', 'weight', 'time', 'currency', 'macro', 'history', 'autocomplete']

// search history
const history = new History()

function useSuggestions(query, autoCompleteEngine) {
  // settings
  const settings = useContext(SettingsContext)

  const locale = settings.general.locale
  const autocompleteLimit = settings.query.suggestions.autocompleteLimit
  const historyLimit = settings.query.suggestions.historyLimit
  const searchHistory = settings.general.searchHistory

  const [suggestions, setSuggestions] = useState([])
  const addSuggestions = useCallback((suggestions, source) => {
    // if suggestions are empty
    if (suggestions.length === 0)
      return
    
    // set source
    suggestions.forEach(suggestion => suggestion.source = source)
    
    setSuggestions(state => {
      const newState = copyObj(state)
      // remove duplicates
      for (let i=0; i < newState.length; i++) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const oldSuggestion = newState[i]
          const occurrenceIndex = suggestions.findIndex(newSuggestion => newSuggestion.suggestion === oldSuggestion.suggestion)
          // break if no occurrencies were found
          if (occurrenceIndex === -1) break

          const newSuggestion = suggestions[occurrenceIndex]
          // if the new suggestion is higher in the hierarchy than the old one
          if (hierarchy.indexOf(newSuggestion.type) > hierarchy.indexOf(oldSuggestion.type)) {
            // delete the old suggestion
            newState.splice(i, 1)
            break
          } else {
            // delete the new suggestion
            suggestions.splice(occurrenceIndex, 1)
          }
        }
      }
      // push new suggestions
      newState.push(...suggestions)
      // sort by relevance
      newState.sort((a, b) => b.relevance - a.relevance)

      return newState
    })
  }, [])
  
  const queryRef = useRef()
  queryRef.current = query

  useEffect(() => {
    // if query is empty
    if (!query) return
    
    // reset state
    setSuggestions([])

    /* autocomplete section */
    autoCompleteEngine(query, locale)
      .then(suggestions => {
        // if the suggestions are outdated
        if (query !== queryRef.current) return
        addSuggestions(suggestions.slice(0, autocompleteLimit), 'autocomplete')
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.warn('[Chevron] autocomplete failed:', err)
      })
    // ---

    /* history section */
    if (searchHistory)
      addSuggestions(history.suggest(query).slice(0, historyLimit), 'history')
    // ---

    /* macro suggestions section */
    const macroMatches = getMacroSuggestions(query)
    if (macroMatches.length > 0)
      addSuggestions(macroMatches, 'macro')
    // ---

    /* calculator section */
    const calcResult = calculate(query)
    if (calcResult !== null)
      addSuggestions([{
        suggestion: formatCalcResult(calcResult),
        type: 'calculator',
        relevance: HIGHEST_RELEVANCE
      }], 'calculator')
    // ---

    /* weight converter section */
    const weightResult = convertWeight(query)
    if (weightResult !== null)
      addSuggestions([{
        suggestion: formatWeightResult(weightResult.result, weightResult.toUnit),
        type: 'weight',
        relevance: HIGHEST_RELEVANCE
      }], 'weight')
    // ---

    /* time converter section */
    const timeResult = convertTime(query)
    if (timeResult !== null)
      addSuggestions([{
        suggestion: formatTimeResult(timeResult.result, timeResult.toUnit),
        type: 'time',
        relevance: HIGHEST_RELEVANCE
      }], 'time')
    // ---

    /* currency section */
    if (currencyCommonRegex.test(query))
      fetchCurrency(query)
        .then(response => {
          // if the suggestions are outdated
          if (query !== queryRef.current) return
          response && addSuggestions([response], 'currency')
        })
        .catch(err => {
          // eslint-disable-next-line no-console
          console.warn('[Chevron] currency lookup failed:', err)
        })
    // ---
    
  }, [query, searchHistory, autoCompleteEngine, autocompleteLimit, historyLimit, addSuggestions, locale])

  return suggestions
}

// currency regex
const currencyCommonRegex = new RegExp(/^(?:[+-]?([0-9]*[.])?[0-9]+\s)?\b[a-zA-Z]{3,}\b \bto\b \b[a-zA-Z]{3,}\b/i)
const currencyAmountRegex = new RegExp(/[+-]?([0-9]*[.])?[0-9]+/gi)
const currencyCodeRegex = new RegExp(/[a-zA-Z]{3,}/gi)

// Common informal names and longer aliases → ISO 4217 codes
const CURRENCY_ALIASES = {
  YEN: 'JPY', YUAN: 'CNY', RENMINBI: 'CNY', RMB: 'CNY',
  STERLING: 'GBP', POUND: 'GBP', QUID: 'GBP',
  BUCK: 'USD', BUCKS: 'USD', DOLLAR: 'USD', DOLLARS: 'USD',
  EURO: 'EUR', EUROS: 'EUR',
  RUBLE: 'RUB', ROUBLE: 'RUB',
  RUPEE: 'INR', RUPEES: 'INR',
  FRANC: 'CHF', FRANCS: 'CHF',
  KRONA: 'SEK', KRONOR: 'SEK',
  KRONE: 'NOK', KRONER: 'NOK',
  WON: 'KRW', BAHT: 'THB',
  LIRA: 'TRY', PESO: 'MXN',
  REAL: 'BRL', REAIS: 'BRL',
  DINAR: 'KWD', DIRHAM: 'AED',
  BITCOIN: 'BTC', ETHEREUM: 'ETH',
}

function normaliseCurrencyCode(raw) {
  const upper = raw.toUpperCase()
  return CURRENCY_ALIASES[upper] ?? upper
}

async function fetchCurrency(query) {
  const amount = query.match(currencyAmountRegex),
        codes = query.match(currencyCodeRegex),
        from = normaliseCurrencyCode(codes[0]),
        to = normaliseCurrencyCode(codes[1])

  if (currencyCodes.includes(from) && currencyCodes.includes(to)) {
    const parsedAmount = amount ? parseFloat(amount[0]) : 1
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(
        `https://open.er-api.com/v6/latest/${from}`,
        { signal: controller.signal })
      const data = await response.json()

      if (data.result === 'success' && data.rates?.[to]) {
        const converted = Math.round((data.rates[to] * parsedAmount + Number.EPSILON) * 100) / 100
        return {
          suggestion: `${converted} ${to}`,
          type: 'currency',
          relevance: HIGHEST_RELEVANCE
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[Chevron] currency request failed:', err.message || err)
    } finally {
      clearTimeout(timeoutId)
    }

    return null
  }
}

// macro suggestion helper — finds all macros whose triggers start with (or equal) the query
// and surfaces them as selectable suggestions. The widget reacts when one is selected.
function getMacroSuggestions(query) {
  if (!query || !window.CONFIG?.macros) return []
  const seen = new Set()
  const results = []

  for (const macro of window.CONFIG.macros) {
    for (const trigger of macro.triggers) {
      // show the macro if the query exactly equals the trigger, or if the
      // trigger starts with what the user typed (prefix discovery)
      if (trigger === query || trigger.startsWith(query)) {
        if (!seen.has(macro.name)) {
          seen.add(macro.name)
          // suggestion value must equal a valid trigger so ParsedQuery can
          // resolve the macro's URL/colors when this suggestion is selected
          results.push({
            suggestion: trigger,
            label: macro.name,
            type: 'macro',
            relevance: trigger === query ? HIGHEST_RELEVANCE : HIGHEST_RELEVANCE - 1,
          })
        }
        break
      }
    }
  }

  return results
}

export default useSuggestions