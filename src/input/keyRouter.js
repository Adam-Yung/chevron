// What a key does, decided in one place. Pure: (UI state, key, context) -> intent. docs/code/src/input/keyRouter.js.md has the map.

export const DOUBLE_SPACE_MS = 300
const FILTER_CHAR = /^[\p{L}\p{N} \-_.]$/u
const PRINTABLE = /^.$/u

const intent = (name, extra = {}) => ({ intent: name, prevent: true, ...extra })
const newTab = k => Boolean(k.meta || k.alt)

function routeShiftTap(state, ctx) {
  if (ctx.inPanel || state.overlay) return null
  if (state.view === 'idle' || state.view === 'macros') return intent('toggleMacros', { viaKeyboard: true })
  return null
}

const MENU_MOVES = { Tab: 1, ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

function routeMenuControl(k) {
  if (k.key === 'Escape') return intent('escape')
  if (k.key === 'Enter') return intent('menuSubmit', { newTab: newTab(k) })
  if (k.key === 'Backspace') return intent('filterBackspace')
  const move = MENU_MOVES[k.key]
  if (!move) return null
  return intent('menuMove', { delta: k.key === 'Tab' && k.shift ? -1 : move })
}

function routeMacros(k, ctx) {
  const control = routeMenuControl(k)
  if (control) return control
  if (k.ctrl || k.meta || k.alt) return null
  if (k.shift && ctx.hotkeys.has(k.code)) return intent('menuHotkey', { code: k.code })
  if (k.key === '?') return intent('openCheatsheet')
  if (!k.shift && FILTER_CHAR.test(k.key)) return intent('filterInput', { char: k.key })
  return null
}

const SUGGESTION_MOVES = { ArrowDown: 1, ArrowUp: -1 }

// Tab takes a highlighted suggestion into the field; with nothing new to take it walks the list.
function routeTab({ selection, query }, k) {
  if (k.shift) return intent('move', { delta: -1 })
  if (selection && selection.suggestion !== query) return intent('complete', { text: selection.suggestion })
  return intent('move', { delta: 1 })
}

function routeSuggestionKeys(state, k, ctx) {
  if (!ctx.hasSuggestions) return null
  if (k.key === 'Tab') return routeTab(state, k)
  if (SUGGESTION_MOVES[k.key]) return intent('move', { delta: SUGGESTION_MOVES[k.key] })
  if (k.key === 'Delete' && k.shift) return intent('removeHistory')
  return null
}

function routeSearchControl(state, k, ctx) {
  if (k.key === 'Escape') return intent('escape')
  if (k.key === 'Enter') return state.query.trim() ? intent('submit', { newTab: newTab(k) }) : intent('none')
  return routeSuggestionKeys(state, k, ctx)
}

function isDoubleSpace(state, k, ctx) {
  return k.key === ' ' && ctx.inQuery && Boolean(state.query.trim()) && ctx.sinceSpace < DOUBLE_SPACE_MS
}

function routeSearch(state, k, ctx) {
  const control = routeSearchControl(state, k, ctx)
  if (control) return control
  if (isDoubleSpace(state, k, ctx)) return intent('askAI', { prevent: false })
  if (k.key === '?' && !state.query.trim()) return intent('openCheatsheet')
  if (k.ctrl || k.meta || k.alt || ctx.inQuery) return null
  return PRINTABLE.test(k.key) ? intent('focusQuery', { prevent: false }) : null
}

// The shapes of `state`, `k`, `ctx` and the returned intent (or null) are listed in the doc named at the top.
export function routeKey(state, k, ctx) {
  if (k.type === 'shiftTap') return routeShiftTap(state, ctx)
  if (ctx.inPanel) return null
  if (k.repeat && (k.key === 'Enter' || k.key === 'Escape')) return null
  if (ctx.onControl && (k.key === 'Enter' || k.key === ' ')) return null
  if (state.overlay) return k.key === 'Escape' ? intent('escape') : null
  if (state.view === 'macros') return routeMacros(k, ctx)
  return routeSearch(state, k, ctx)
}
