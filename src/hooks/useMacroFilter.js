import { useEffect } from 'react'
import { useStateSelector, useUpdate } from '../contexts/Store'
import { allowedModes } from '../rules'

// Phase 8a: while the macro menu is open, route printable keystrokes into
// `store.macroFilter` instead of the QueryField. Keeps macro mode visually
// independent from the search-suggestions stack.
//
// Rules:
//  - Only fires when `mode` is in `allowedModes.get('MacroFilter')` (today
//    that's just `'opened'`).
//  - Letters / digits / space / `-` / `_` / `.` are appended (lowercased
//    so the eventual matcher can be case-insensitive).
//  - Backspace pops the last character; if the buffer is empty the event
//    is left for `App.jsx` to interpret (Esc / close paths).
//  - Modified keys (Ctrl/Cmd/Alt) are ignored so browser shortcuts and
//    the existing `?`-opens-cheatsheet keep working.
//  - Esc is intentionally NOT handled here. App.jsx owns the
//    "Esc with non-empty filter pops a char, Esc with empty filter
//    closes" behavior so the close path lives in one file.
const FILTER_CHAR_RE = /^[\p{L}\p{N} \-_.]$/u

function useMacroFilter() {
  const mode = useStateSelector(s => s.mode)
  const filter = useStateSelector(s => s.macroFilter)
  const updateStore = useUpdate()

  useEffect(() => {
    if (!allowedModes.get('MacroFilter').has(mode)) return

    const onKey = e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'Backspace') {
        if (filter.length === 0) return
        e.preventDefault()
        updateStore({ macroFilter: filter.slice(0, -1) })
        return
      }

      if (e.key.length === 1 && FILTER_CHAR_RE.test(e.key)) {
        e.preventDefault()
        updateStore({ macroFilter: filter + e.key.toLowerCase() })
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mode, filter, updateStore])
}

export default useMacroFilter
