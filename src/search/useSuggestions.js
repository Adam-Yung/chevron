import { useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { SettingsContext } from '../settings/SettingsProvider'
import { ANSWER_TYPES, currencyAnswer, instantAnswers, looksLikeCurrency } from '../answers/index'
import { fetchAutocomplete, peekAutocomplete, prefixFallback } from './autocomplete'
import { history, suggestFrom } from './history'
import { macroSuggestions, mergeSuggestions } from './suggestions'
import useConfig from './useConfig'

// Long enough to skip requests for keys typed in a burst, short enough that suggestions feel immediate.
export const NETWORK_DEBOUNCE_MS = 120
const answerTypes = new Set(ANSWER_TYPES)
export const isAnswerType = type => answerTypes.has(type)

function useLocalSuggestions(query) {
  const settings = useContext(SettingsContext)
  const config = useConfig()
  const entries = useSyncExternalStore(history.subscribe, history.snapshot)
  const historyOn = settings.general.searchHistory
  const historyLimit = settings.query.suggestions.historyLimit
  return useMemo(() => {
    if (!query) return []
    const fromHistory = historyOn ? suggestFrom(entries, query, historyLimit) : []
    return [instantAnswers(query), macroSuggestions(query, config.macros), fromHistory]
  }, [query, config, entries, historyOn, historyLimit])
}

function useRemoteSuggestions(query) {
  const settings = useContext(SettingsContext)
  const locale = settings.general.locale
  const limit = settings.query.suggestions.autocompleteLimit
  const [remote, setRemote] = useState({ query: '', autocomplete: [], currency: null })

  useEffect(() => {
    if (!query) return undefined
    const controller = new AbortController()
    const settle = patch => {
      if (!controller.signal.aborted) setRemote(r => ({ ...(r.query === query ? r : { query, autocomplete: [], currency: null }), ...patch }))
    }
    const timer = setTimeout(() => {
      if (limit > 0) fetchAutocomplete(query, locale).then(items => settle({ autocomplete: items }), () => settle({}))
      if (looksLikeCurrency(query)) currencyAnswer(query, { signal: controller.signal }).then(a => settle({ currency: a }), () => {})
    }, peekAutocomplete(query, locale) ? 0 : NETWORK_DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, locale, limit])

  return useMemo(() => {
    if (remote.query === query) return [remote.currency ? [remote.currency] : [], remote.autocomplete.slice(0, limit)]
    return [[], (peekAutocomplete(query, locale) ?? prefixFallback(query, locale)).slice(0, limit)]
  }, [remote, query, locale, limit])
}

/**
 * Every suggestion for the query, merged and ordered (see suggestions.js). Local sources answer on the same render; remote ones
 * are added when they arrive, and only if the query has not changed meanwhile.
 * @param {string} query
 */
export default function useSuggestions(query) {
  const local = useLocalSuggestions(query)
  const remote = useRemoteSuggestions(query)
  return useMemo(() => (query ? mergeSuggestions([...local, ...remote], isAnswerType) : []), [query, local, remote])
}
