// The only UI state in the app, and the only way to change it. docs/code/src/state/ui.js.md lists the invariants.

/** @typedef {'idle' | 'search' | 'macros'} View */
/** @typedef {{ suggestion: string, type: string }} Selection */

export const initialUiState = Object.freeze({
  /** @type {View} */
  view: 'idle',
  query: '',
  /** @type {Selection | null} */
  selection: null,
  macroFilter: '',
  // Index into the filtered sites, or null for "the first one".
  /** @type {number | null} */
  menuCursor: null,
  // The sites menu shows per-card key hints only when it was opened from the keyboard.
  hints: false,
  aiPrompt: '',
  /** @type {null | 'settings' | 'cheatsheet'} */
  overlay: null,
  // Ctrl held: the next submit skips macros and uses the search engine.
  forceEngine: false,
  /** @type {null | { url: string, macro?: string }} */
  leaving: null,
  /** @type {null | { text: string, id: number }} */
  notice: null,
  // Bumped by every full reset so views can restart cleanly.
  epoch: 0
})

const MULTI_SPACE = /\s{2,}/g

// Whitespace alone is not a query: a stray Space must not open the search view or send a blank search.
const hasText = query => query.trim() !== ''

function withQuery(state, query) {
  if (query === state.query) return state
  return { ...state, query, selection: null, aiPrompt: '', view: hasText(query) ? 'search' : 'idle' }
}

function toggleMacros(state, viaKeyboard) {
  if (state.view === 'macros') return { ...state, view: 'idle' }
  if (state.view !== 'idle') return state
  return { ...state, view: 'macros', hints: Boolean(viaKeyboard) }
}

function escape(state) {
  if (state.overlay) return { ...state, overlay: null }
  if (state.aiPrompt) return { ...state, aiPrompt: '' }
  if (state.view === 'macros') return state.macroFilter ? { ...state, macroFilter: '' } : { ...state, view: 'idle' }
  if (state.query) return withQuery(state, '')
  return state
}

function reset(state) {
  return { ...initialUiState, epoch: state.epoch + 1, notice: state.notice }
}

function moveCursor(state, delta, count) {
  if (state.view !== 'macros' || count <= 0) return state
  const from = state.menuCursor ?? (delta > 0 ? -1 : 0)
  return { ...state, menuCursor: (((from + delta) % count) + count) % count }
}

let noticeIds = 0

const handlers = {
  typed: (s, a) => withQuery(s, a.text.replace(MULTI_SPACE, ' ')),
  selected: (s, a) => (s.view === 'search' ? { ...s, selection: a.selection } : s),
  escaped: s => escape(s),
  macrosToggled: (s, a) => toggleMacros(s, a.viaKeyboard),
  macrosClosed: s => (s.view === 'macros' ? { ...s, view: 'idle' } : s),
  filterChanged: (s, a) => (s.view === 'macros' ? { ...s, macroFilter: a.text.toLowerCase(), menuCursor: null } : s),
  menuCursorMoved: (s, a) => moveCursor(s, a.delta, a.count),
  aiAsked: s => (s.query.trim() ? { ...s, aiPrompt: s.query.trim() } : s),
  aiClosed: s => ({ ...s, aiPrompt: '' }),
  overlayOpened: (s, a) => ({ ...s, overlay: a.overlay }),
  overlayClosed: s => ({ ...s, overlay: null }),
  forceEngineChanged: (s, a) => ({ ...s, forceEngine: a.on }),
  leaving: (s, a) => ({ ...s, leaving: { url: a.url, macro: a.macro } }),
  noticed: (s, a) => ({ ...s, notice: { text: a.text, id: ++noticeIds } }),
  noticeCleared: (s, a) => (s.notice?.id === a.id ? { ...s, notice: null } : s),
  reset: s => reset(s)
}

// Fields that other fields depend on are corrected here, after every action, so no handler can leave a contradiction behind.
function enforceInvariants(state) {
  let next = state
  if (next.view !== 'macros' && (next.macroFilter || next.hints || next.menuCursor !== null)) {
    next = { ...next, macroFilter: '', hints: false, menuCursor: null }
  }
  if (next.view === 'search' && !hasText(next.query)) next = { ...next, view: 'idle' }
  if (next.view === 'idle' && hasText(next.query)) next = { ...next, view: 'search' }
  if (!hasText(next.query) && (next.selection || next.aiPrompt)) next = { ...next, selection: null, aiPrompt: '' }
  return next
}

// A user acting again means any pending navigation did not happen (or happened in another tab): stop showing it.
const CANCELS_LEAVING = new Set(['typed', 'escaped', 'macrosToggled', 'overlayOpened'])

export function uiReducer(state, action) {
  const handler = handlers[action.type]
  if (!handler) return state
  let next = handler(state, action)
  if (next.leaving && CANCELS_LEAVING.has(action.type)) next = { ...next, leaving: null }
  return next === state ? state : enforceInvariants(next)
}

/** Action creators: the vocabulary of everything the UI can do. */
export const ui = {
  typed: text => ({ type: 'typed', text }),
  selected: selection => ({ type: 'selected', selection }),
  escaped: () => ({ type: 'escaped' }),
  macrosToggled: viaKeyboard => ({ type: 'macrosToggled', viaKeyboard }),
  macrosClosed: () => ({ type: 'macrosClosed' }),
  filterChanged: text => ({ type: 'filterChanged', text }),
  aiAsked: () => ({ type: 'aiAsked' }),
  aiClosed: () => ({ type: 'aiClosed' }),
  overlayOpened: overlay => ({ type: 'overlayOpened', overlay }),
  overlayClosed: () => ({ type: 'overlayClosed' }),
  forceEngineChanged: on => ({ type: 'forceEngineChanged', on }),
  menuCursorMoved: (delta, count) => ({ type: 'menuCursorMoved', delta, count }),
  leaving: (url, macro) => ({ type: 'leaving', url, macro }),
  noticed: text => ({ type: 'noticed', text }),
  noticeCleared: id => ({ type: 'noticeCleared', id }),
  reset: () => ({ type: 'reset' })
}
