import { useContext, useMemo, useRef } from 'react'
import useIsKeyPressed from './useIsKeyPressed'
import { SettingsContext , ColorSchemeContext} from '../contexts/Settings'
import { useStateSelector } from '../contexts/Store'
import { allowedModes } from '../rules'
import ParsedQuery from '../classes/parsedQuery'

function useParseQuery(value, type='query', origin, persist=false) {
  /* settings */
  const settings = useContext(SettingsContext)
  const engine = window.CONFIG?.engines?.[settings.general.searchEngine] ?? {}
  const forceSearchEngineOnCtrl = settings.query.forceSearchEngineOnCtrl
  // ---

  // color scheme
  const colorScheme = useContext(ColorSchemeContext)

  // Only allow Ctrl-force-search while the query field is actually active.
  // In macro menu mode ('opened') Ctrl has no search-related meaning and
  // forcing the search engine would affect QuickLook even though the user
  // is navigating the macro menu.
  const mode = useStateSelector(s => s.mode)
  const isCtrlPressed = useIsKeyPressed('Control')
  const forceUseSearchEngine = forceSearchEngineOnCtrl && isCtrlPressed && allowedModes.get('QueryField').has(mode)
  
  const parsedQuery = useMemo(() => new ParsedQuery(value, type, origin, engine, colorScheme, forceUseSearchEngine), [value, type, origin, engine, colorScheme, forceUseSearchEngine])
  
  const persistedRef = useRef(parsedQuery)
  if (!persist)
    persistedRef.current = parsedQuery

  return [persistedRef.current, isCtrlPressed]
}

export default useParseQuery