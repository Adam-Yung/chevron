import { useCallback, useContext, useMemo, useRef } from 'react'
import { ColorSchemeContext, SettingsContext } from '../settings/SettingsProvider'
import { useUi } from '../state/UiStore'
import { resolveDestination } from './resolve'
import useConfig from './useConfig'
import { isAnswerType } from './useSuggestions'
import { useSuggestionList } from './SearchProvider'
import { submitTarget } from './suggestions'

/** A resolver bound to the current config, engine, colour scheme and Ctrl state. */
export function useResolver() {
  const settings = useContext(SettingsContext)
  const colorScheme = useContext(ColorSchemeContext)
  const config = useConfig()
  const forceEngine = useUi(s => s.forceEngine) && settings.query.forceSearchEngineOnCtrl
  const engine = config.engines?.[settings.general.searchEngine] ?? Object.values(config.engines ?? {})[0]
  return useCallback(
    (text, { type, origin } = {}) => resolveDestination(text, { type, origin, config, engine, forceEngine, colorScheme, isAnswer: isAnswerType }),
    [config, engine, forceEngine, colorScheme]
  )
}

/** Where Enter would go now. While the query empties, the last destination is kept so the closing animation does not blank. */
export default function useDestination() {
  const query = useUi(s => s.query)
  const selection = useUi(s => s.selection)
  const suggestions = useSuggestionList()
  const resolve = useResolver()
  const last = useRef(null)
  return useMemo(() => {
    if (!query.trim()) return last.current
    const target = submitTarget(query, selection, suggestions, isAnswerType)
    last.current = resolve(target.suggestion, { type: target.type, origin: query })
    return last.current
  }, [query, selection, suggestions, resolve])
}
