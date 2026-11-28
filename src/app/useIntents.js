import { useCallback, useContext, useRef } from 'react'
import { SettingsContext } from '../settings/SettingsProvider'
import { useUiStore } from '../state/UiStore'
import { ui } from '../state/ui'
import { useResolver } from '../search/useDestination'
import { useSuggestionsRef } from '../search/SearchProvider'
import { stepSelection, submitTarget } from '../search/suggestions'
import { isAnswerType } from '../search/useSuggestions'
import { history } from '../search/history'
import { usePinnedMacros } from '../search/useConfig'
import { filterMacros } from '../features/macros/filterMacros'
import { getQueryField } from '../features/search/queryFieldId'
import { copyText } from './copyText'
import useLaunch from './useLaunch'

const REMEMBERED_KINDS = new Set(['search', 'url'])

function useSearchActions(live) {
  return {
    async submit({ newTab }) {
      const { state, suggestions, resolve, launch, settings, dispatch } = live.current
      const target = submitTarget(state.query, state.selection, suggestions, isAnswerType)
      const destination = resolve(target.suggestion, { type: target.type, origin: state.query })
      if (destination.kind === 'answer') {
        const copied = await copyText(target.suggestion)
        return dispatch(ui.noticed(copied ? 'Copied' : 'Could not copy'))
      }
      if (settings.general.searchHistory && REMEMBERED_KINDS.has(destination.kind)) history.add(target.suggestion)
      launch(destination.url, { newTab, macro: destination.macro?.name })
    },
    move({ delta }) {
      const { state, suggestions, dispatch } = live.current
      const next = stepSelection(suggestions, state.selection, delta)
      dispatch(ui.selected(next && { suggestion: next.suggestion, type: next.type }))
    },
    removeHistory() {
      const { state, dispatch } = live.current
      if (state.selection?.type !== 'history') return
      history.remove(state.selection.suggestion)
      dispatch(ui.selected(null))
      dispatch(ui.noticed('Removed from history'))
    },
    askAI() {
      const { settings, dispatch } = live.current
      if (settings.query.AI.enabled) dispatch(ui.aiAsked())
    },
    focusQuery() {
      getQueryField()?.focus()
    }
  }
}

function launchMacro(live, macro, newTab) {
  if (macro) live.current.launch(macro.url, { newTab, macro: macro.name })
}

const visibleMacros = ({ pinned, state }) => filterMacros(pinned, state.macroFilter)

function useMenuActions(live) {
  return {
    menuSubmit({ newTab }) {
      launchMacro(live, visibleMacros(live.current)[live.current.state.menuCursor ?? 0], newTab)
    },
    menuHotkey({ code }) {
      launchMacro(live, live.current.pinned.find(m => m.key === code), false)
    },
    menuMove({ delta }) {
      live.current.dispatch(ui.menuCursorMoved(delta, visibleMacros(live.current).length))
    },
    filterInput({ char }) {
      const { state, dispatch } = live.current
      dispatch(ui.filterChanged(state.macroFilter + char))
    },
    filterBackspace() {
      const { state, dispatch } = live.current
      if (state.macroFilter) dispatch(ui.filterChanged(state.macroFilter.slice(0, -1)))
    },
    openMacro: launchMacro.bind(null, live)
  }
}

// Carries out what the key router decided. Handlers read everything through `live`, so listeners never need re-binding.
/** @returns {{ perform: (intent: { intent: string }) => void, openMacro: (macro: object, newTab?: boolean) => void }} */
export default function useIntents() {
  const store = useUiStore()
  const settings = useContext(SettingsContext)
  const suggestionsRef = useSuggestionsRef()
  const resolve = useResolver()
  const launch = useLaunch()
  const pinned = usePinnedMacros()
  const live = useRef(null)
  live.current = {
    get state() { return store.getState() },
    get suggestions() { return suggestionsRef.current },
    dispatch: store.dispatch, settings, resolve, launch, pinned
  }

  const search = useSearchActions(live)
  const menu = useMenuActions(live)
  const handlers = useRef(null)
  handlers.current = {
    ...search,
    ...menu,
    escape: () => store.dispatch(ui.escaped()),
    complete: ({ text }) => store.dispatch(ui.typed(text)),
    toggleMacros: ({ viaKeyboard }) => store.dispatch(ui.macrosToggled(viaKeyboard)),
    openCheatsheet: () => store.dispatch(ui.overlayOpened('cheatsheet')),
    none: () => {}
  }

  const perform = useCallback(i => handlers.current[i.intent]?.(i), [])
  const openMacro = useCallback((macro, newTab) => handlers.current.openMacro(macro, newTab), [])
  return { perform, openMacro }
}
