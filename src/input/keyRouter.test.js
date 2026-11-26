import { describe, it, expect } from 'vitest'
import { routeKey, DOUBLE_SPACE_MS } from './keyRouter'
import { initialUiState, ui, uiReducer } from '../state/ui'

const state = (...actions) => actions.reduce(uiReducer, initialUiState)
const ctx = (extra = {}) => ({ inPanel: false, inQuery: true, hasSuggestions: true, sinceSpace: 10_000, hotkeys: new Set(['KeyG']), ...extra })
const key = (k, extra = {}) => ({ type: 'keydown', key: k, code: '', ...extra })
const route = (s, k, c) => routeKey(s, k, c ?? ctx())

describe('routeKey: search', () => {
  const searching = state(ui.typed('cats'))

  it('Enter submits in this tab, Alt/Cmd+Enter in a new tab', () => {
    expect(route(searching, key('Enter'))).toMatchObject({ intent: 'submit', newTab: false, prevent: true })
    expect(route(searching, key('Enter', { meta: true }))).toMatchObject({ intent: 'submit', newTab: true })
    expect(route(searching, key('Enter', { alt: true }))).toMatchObject({ intent: 'submit', newTab: true })
  })

  it('Enter on an empty field does nothing but still stops the newline', () => {
    expect(route(initialUiState, key('Enter'))).toMatchObject({ intent: 'none', prevent: true })
  })

  it('a held Enter does not submit twice', () => {
    expect(route(searching, key('Enter', { repeat: true }))).toBeNull()
  })

  it('Tab, Shift+Tab and arrows move through suggestions only when there are some', () => {
    expect(route(searching, key('Tab'))).toMatchObject({ intent: 'move', delta: 1 })
    expect(route(searching, key('Tab', { shift: true }))).toMatchObject({ intent: 'move', delta: -1 })
    expect(route(searching, key('ArrowDown'))).toMatchObject({ intent: 'move', delta: 1 })
    expect(route(searching, key('ArrowUp'))).toMatchObject({ intent: 'move', delta: -1 })
    expect(route(searching, key('Tab'), ctx({ hasSuggestions: false }))).toBeNull()
  })

  it('Shift+Delete removes the highlighted history entry', () => {
    expect(route(searching, key('Delete', { shift: true }))).toMatchObject({ intent: 'removeHistory' })
    expect(route(searching, key('Delete'))).toBeNull()
  })

  it('a second Space within the window asks the AI, without eating the space', () => {
    expect(route(searching, key(' '), ctx({ sinceSpace: DOUBLE_SPACE_MS - 1 }))).toMatchObject({ intent: 'askAI', prevent: false })
    expect(route(searching, key(' '), ctx({ sinceSpace: DOUBLE_SPACE_MS + 1 }))).toBeNull()
    expect(route(initialUiState, key(' '), ctx({ sinceSpace: 1 }))).toBeNull()
  })

  it('? opens the cheatsheet only on an empty field', () => {
    expect(route(initialUiState, key('?'))).toMatchObject({ intent: 'openCheatsheet' })
    expect(route(searching, key('?'))).toBeNull()
  })

  it('a printable key outside the field pulls focus to it and lets the character through', () => {
    expect(route(initialUiState, key('a'), ctx({ inQuery: false }))).toMatchObject({ intent: 'focusQuery', prevent: false })
    expect(route(initialUiState, key('a'), ctx({ inQuery: false }))).toMatchObject({ intent: 'focusQuery' })
    expect(route(initialUiState, key('a', { meta: true }), ctx({ inQuery: false }))).toBeNull()
    expect(route(initialUiState, key('a'))).toBeNull()
  })
})

describe('routeKey: sites menu', () => {
  const menu = state(ui.macrosToggled(true))

  it('letters filter, Backspace edits the filter', () => {
    expect(route(menu, key('g'))).toMatchObject({ intent: 'filterInput', char: 'g' })
    expect(route(menu, key('Backspace'))).toMatchObject({ intent: 'filterBackspace' })
  })

  it('Shift plus a bound letter opens that card; an unbound one does nothing', () => {
    expect(route(menu, key('G', { shift: true, code: 'KeyG' }))).toMatchObject({ intent: 'menuHotkey', code: 'KeyG' })
    expect(route(menu, key('Z', { shift: true, code: 'KeyZ' }))).toBeNull()
  })

  it('Enter opens the chosen card, arrows and Tab move the cursor, Esc steps back', () => {
    expect(route(menu, key('Enter'))).toMatchObject({ intent: 'menuSubmit', newTab: false })
    expect(route(menu, key('ArrowLeft'))).toMatchObject({ intent: 'menuMove', delta: -1 })
    expect(route(menu, key('Tab', { shift: true }))).toMatchObject({ intent: 'menuMove', delta: -1 })
    expect(route(menu, key('Escape'))).toMatchObject({ intent: 'escape' })
  })

  it('browser shortcuts pass through', () => {
    expect(route(menu, key('r', { meta: true }))).toBeNull()
  })
})

describe('routeKey: Shift tap', () => {
  const tap = { type: 'shiftTap' }

  it('toggles the menu from idle and from the menu, never over a search or a panel', () => {
    expect(route(initialUiState, tap)).toMatchObject({ intent: 'toggleMacros', viaKeyboard: true })
    expect(route(state(ui.macrosToggled(false)), tap)).toMatchObject({ intent: 'toggleMacros' })
    expect(route(state(ui.typed('q')), tap)).toBeNull()
    expect(route(initialUiState, tap, ctx({ inPanel: true }))).toBeNull()
    expect(route(state(ui.overlayOpened('settings')), tap)).toBeNull()
  })
})

describe('routeKey: panels own their keys', () => {
  it('ignores every key while focus is inside a panel', () => {
    expect(route(state(ui.typed('q')), key('Escape'), ctx({ inPanel: true }))).toBeNull()
    expect(route(state(ui.typed('q')), key('Enter'), ctx({ inPanel: true }))).toBeNull()
  })

  it('with an overlay open but focus outside it, only Escape acts, and it closes the overlay', () => {
    const s = state(ui.typed('q'), ui.overlayOpened('cheatsheet'))
    expect(route(s, key('Escape'))).toMatchObject({ intent: 'escape' })
    expect(route(s, key('Enter'))).toBeNull()
    expect(route(s, key('a'), ctx({ inQuery: false }))).toBeNull()
  })
})

describe('routeKey: focused controls', () => {
  it('leave Enter and Space to the button or link, so keyboard users can press it', () => {
    const c = ctx({ inQuery: false, onControl: true })
    expect(route(initialUiState, key('Enter'), c)).toBeNull()
    expect(route(state(ui.typed('q')), key('Enter'), c)).toBeNull()
    expect(route(initialUiState, key(' '), c)).toBeNull()
    expect(route(initialUiState, key('a'), c)).toMatchObject({ intent: 'focusQuery' })
    expect(route(state(ui.typed('q')), key('Escape'), c)).toMatchObject({ intent: 'escape' })
  })
})

describe('routeKey: blank query', () => {
  it('Enter on whitespace sends nothing', () => {
    expect(route(state(ui.typed('  ')), key('Enter'))).toMatchObject({ intent: 'none' })
  })
})
