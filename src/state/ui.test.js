import { describe, it, expect } from 'vitest'
import { initialUiState, ui, uiReducer } from './ui'

const run = (...actions) => actions.reduce(uiReducer, initialUiState)

describe('uiReducer: query and view', () => {
  it('typing enters search, clearing returns to idle', () => {
    const typed = run(ui.typed('cats'))
    expect(typed.view).toBe('search')
    expect(uiReducer(typed, ui.typed('')).view).toBe('idle')
  })

  it('collapses runs of spaces so a double space never reaches the query', () => {
    expect(run(ui.typed('a  b')).query).toBe('a b')
  })

  it('a new query drops the selection and the AI prompt', () => {
    const s = run(ui.typed('cat'), ui.selected({ suggestion: 'cats', type: 'autocomplete' }), ui.aiAsked(), ui.typed('cats'))
    expect(s.selection).toBeNull()
    expect(s.aiPrompt).toBe('')
  })

  it('ignores selection outside search', () => {
    expect(run(ui.selected({ suggestion: 'x', type: 'history' })).selection).toBeNull()
  })

  it('returns the same object when nothing changes, so subscribers are not woken', () => {
    expect(uiReducer(initialUiState, ui.escaped())).toBe(initialUiState)
    expect(uiReducer(initialUiState, { type: 'unknown' })).toBe(initialUiState)
  })
})

describe('uiReducer: Escape always makes progress toward a clean idle', () => {
  const states = {
    overlay: run(ui.typed('q'), ui.overlayOpened('settings')),
    ai: run(ui.typed('q'), ui.aiAsked()),
    filtered: run(ui.macrosToggled(true), ui.filterChanged('gi')),
    macros: run(ui.macrosToggled(false)),
    search: run(ui.typed('q'))
  }

  for (const [name, start] of Object.entries(states)) {
    it(`from ${name}: at most three presses reach idle with an empty query`, () => {
      let s = start
      for (let i = 0; i < 3; i++) s = uiReducer(s, ui.escaped())
      expect(s.view).toBe('idle')
      expect(s.query).toBe('')
      expect(s.overlay).toBeNull()
      expect(s.aiPrompt).toBe('')
      expect(s.macroFilter).toBe('')
    })
  }

  it('closes the overlay first and keeps the query', () => {
    const s = uiReducer(states.overlay, ui.escaped())
    expect(s.overlay).toBeNull()
    expect(s.query).toBe('q')
  })

  it('closes the AI panel before clearing the query', () => {
    const s = uiReducer(states.ai, ui.escaped())
    expect(s.aiPrompt).toBe('')
    expect(s.query).toBe('q')
  })
})

describe('uiReducer: sites menu', () => {
  it('toggles between idle and macros, remembering keyboard hints only while open', () => {
    const open = run(ui.macrosToggled(true))
    expect(open.view).toBe('macros')
    expect(open.hints).toBe(true)
    const closed = uiReducer(open, ui.macrosToggled(true))
    expect(closed.view).toBe('idle')
    expect(closed.hints).toBe(false)
  })

  it('does not open over a search in progress', () => {
    expect(run(ui.typed('q'), ui.macrosToggled(true)).view).toBe('search')
  })

  it('clears the filter whenever the menu closes', () => {
    const s = run(ui.macrosToggled(false), ui.filterChanged('GI'), ui.macrosClosed())
    expect(s.macroFilter).toBe('')
    expect(run(ui.macrosToggled(false), ui.filterChanged('GI')).macroFilter).toBe('gi')
  })

  it('ignores filter input outside the menu', () => {
    expect(run(ui.filterChanged('x')).macroFilter).toBe('')
  })
})

describe('uiReducer: leaving never blocks', () => {
  it('any user action after a navigation started cancels it and still applies', () => {
    const leaving = run(ui.typed('q'), ui.leaving('https://example.com'))
    const typed = uiReducer(leaving, ui.typed('qq'))
    expect(typed.leaving).toBeNull()
    expect(typed.query).toBe('qq')
    expect(uiReducer(leaving, ui.escaped()).leaving).toBeNull()
  })

  it('reset returns to the initial state and bumps the epoch', () => {
    const s = run(ui.typed('q'), ui.leaving('https://example.com'), ui.reset())
    expect({ ...s, epoch: 0 }).toEqual({ ...initialUiState })
    expect(s.epoch).toBe(1)
  })
})

describe('uiReducer: AI', () => {
  it('asks with the trimmed query and refuses an empty one', () => {
    expect(run(ui.typed(' why '), ui.aiAsked()).aiPrompt).toBe('why')
    expect(run(ui.aiAsked()).aiPrompt).toBe('')
  })
})

describe('uiReducer: menu cursor', () => {
  it('wraps around the visible count in both directions', () => {
    const open = run(ui.macrosToggled(true))
    expect(uiReducer(open, ui.menuCursorMoved(1, 3)).menuCursor).toBe(0)
    expect(uiReducer(open, ui.menuCursorMoved(-1, 3)).menuCursor).toBe(2)
    let s = open
    for (let i = 0; i < 4; i++) s = uiReducer(s, ui.menuCursorMoved(1, 3))
    expect(s.menuCursor).toBe(0)
  })

  it('resets when the filter changes or the menu closes, and does nothing elsewhere', () => {
    const moved = run(ui.macrosToggled(true), ui.menuCursorMoved(1, 3), ui.menuCursorMoved(1, 3))
    expect(uiReducer(moved, ui.filterChanged('g')).menuCursor).toBeNull()
    expect(uiReducer(moved, ui.macrosClosed()).menuCursor).toBeNull()
    expect(run(ui.menuCursorMoved(1, 3)).menuCursor).toBeNull()
    expect(run(ui.macrosToggled(true), ui.menuCursorMoved(1, 0)).menuCursor).toBeNull()
  })
})

describe('uiReducer: notices', () => {
  it('a notice survives a reset and is cleared only by its own id', () => {
    const s = run(ui.noticed('Copied'), ui.reset())
    expect(s.notice.text).toBe('Copied')
    const newer = uiReducer(s, ui.noticed('Again'))
    expect(uiReducer(newer, ui.noticeCleared(s.notice.id)).notice.text).toBe('Again')
    expect(uiReducer(newer, ui.noticeCleared(newer.notice.id)).notice).toBeNull()
  })
})

describe('uiReducer: blank input', () => {
  it('whitespace alone stays idle and carries no selection', () => {
    const s = run(ui.typed('   '))
    expect(s.view).toBe('idle')
    expect(s.query).toBe(' ')
    expect(uiReducer(s, ui.selected({ suggestion: 'x', type: 'history' })).selection).toBeNull()
    expect(run(ui.typed(' a')).view).toBe('search')
  })
})
