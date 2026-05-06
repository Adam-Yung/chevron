import { useEffect, useRef, useCallback, memo } from 'react'
import { FiX } from 'react-icons/fi'
import classes from './Cheatsheet.module.css'

/**
 * Static keymap. Source-of-truth for what we tell the user is supported.
 * Adding a new shortcut anywhere in the app should add a row here as
 * well — Phase 13 (test coverage) will assert this stays in sync.
 *
 * `keys` is an array of arrays: each inner array is one combo
 * ([key1, key2, …]). Multiple combos render as alternative lines
 * within the same shortcut cell.
 */
const SECTIONS = [
  {
    title: 'Search',
    rows: [
      { keys: [['type anywhere']], label: 'Focus is auto-grabbed when you start typing' },
      { keys: [['Enter']], label: 'Submit current query / open suggestion' },
      { keys: [['Tab'], ['Shift', 'Tab']], label: 'Cycle through suggestions' },
      { keys: [['ArrowDown'], ['ArrowUp']], label: 'Move suggestion selection' },
      { keys: [['Esc']], label: 'Clear the query' },
      { keys: [['Esc', 'Esc']], label: 'Full reset (clears suggestion + AI completion + blurs input)' },
      { keys: [['Ctrl']], label: 'Force search engine (ignore matching macros)' }
    ]
  },
  {
    title: 'AI completion',
    rows: [
      { keys: [['Space', 'Space']], label: 'Double-tap Space to send the query to the configured AI provider' }
    ]
  },
  {
    title: 'Macros menu',
    rows: [
      { keys: [['Shift']], label: 'Toggle the macros menu (Shift again, Esc, or right-click closes)' },
      { keys: [['Right-click']], label: 'Open from anywhere; reset to default when already open' },
      { keys: [['<letters>']], label: 'Type while the menu is open to filter cards by name, category, or trigger' },
      { keys: [['Backspace']], label: 'Delete the last character of the filter' },
      { keys: [['Shift', '<key>']], label: 'Trigger a macro hotkey (when its `key` property is set)' },
      { keys: [['ArrowLeft'], ['ArrowRight']], label: 'Navigate between macro pages' }
    ]
  },
  {
    title: 'This dialog',
    rows: [
      { keys: [['Shift', '/']], label: 'Open this cheatsheet (anywhere except inside a text field)' },
      { keys: [['Esc']], label: 'Close the cheatsheet' }
    ]
  }
]

function Kbd({ k }) {
  // Pretty-print well-known key codes
  const display = ({
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Right-click': 'Right-click',
    'type anywhere': 'type anywhere'
  })[k] || k
  return <kbd className={classes['kbd']}>{display}</kbd>
}

function Combo({ combo }) {
  return (
    <span className={classes['combo']}>
      {combo.map((key, ki) => (
        <span key={ki} className={classes['combo']}>
          {ki > 0 && <span className={classes['plus']}>+</span>}
          <Kbd k={key} />
        </span>
      ))}
    </span>
  )
}

function Cheatsheet({ open, onClose }) {
  const dialogRef = useRef(null)
  const lastFocusedRef = useRef(null)

  // Trap focus + restore on close. We don't use a heavy focus-trap lib
  // — a simple "tab wraps within the dialog" loop is enough.
  useEffect(() => {
    if (!open) return

    lastFocusedRef.current = document.activeElement

    // Focus the dialog itself so screen readers announce it; it is
    // tabIndex=-1 so it can receive programmatic focus without being
    // tab-stoppable itself.
    const id = window.requestAnimationFrame(() => {
      dialogRef.current?.focus()
    })

    return () => {
      window.cancelAnimationFrame(id)
      // Return focus to wherever it was when the dialog opened.
      if (lastFocusedRef.current && typeof lastFocusedRef.current.focus === 'function') {
        try { lastFocusedRef.current.focus() } catch { /* node went away, ignore */ }
      }
    }
  }, [open])

  const handleKeyDown = useCallback((e) => {
    if (!open) return
    if (e.key === 'Escape') {
      e.stopPropagation()
      e.preventDefault()
      onClose()
      return
    }
    if (e.key === 'Tab') {
      // Tiny focus trap: only the close button is focusable inside, so
      // any Tab keeps focus on it.
      const focusables = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) || []
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className={classes['backdrop']}
      onClick={onClose}
      data-keep-focus="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        tabIndex={-1}
        className={classes['dialog']}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <header className={classes['header']}>
          <h2 className={classes['title']}>Keyboard shortcuts</h2>
          <button
            type="button"
            className={classes['closeButton']}
            onClick={onClose}
            aria-label="Close cheatsheet"
            title="Close (Esc)"
          >
            <FiX size="1.25em" />
          </button>
        </header>

        <div className={classes['body']}>
          {SECTIONS.map(section => (
            <section key={section.title} className={classes['section']}>
              <h3 className={classes['sectionTitle']}>{section.title}</h3>
              <table className={classes['table']}>
                <tbody>
                  {section.rows.map((row, ri) => (
                    <tr key={ri} className={classes['row']}>
                      <td className={classes['keysCell']}>
                        {row.keys.map((combo, ci) => (
                          <div key={ci} className={classes['comboLine']}>
                            <Combo combo={combo} />
                          </div>
                        ))}
                      </td>
                      <td className={classes['labelCell']}>{row.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export default memo(Cheatsheet)
