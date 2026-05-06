import { useRef, useEffect, useCallback, memo, useState } from 'react'
import { FiX } from 'react-icons/fi'
import classes from './MacrosEditor.module.css'
import MacrosEditorBody from './MacrosEditorBody'

/**
 * Standalone modal wrapper around MacrosEditorBody. Used when the
 * editor is opened directly (e.g. from a deep-link or a slot outside
 * Settings). The new Settings modal embeds MacrosEditorBody directly
 * as its "Macros" tab, so it does not go through this wrapper.
 *
 * Design constraints kept from Phase 4:
 *   - Fully offline. No network calls anywhere in this flow.
 *   - No heavy deps. Native form controls only.
 *   - Saves go through `saveConfig`, which validates URL schemes
 *     before persisting.
 */

function MacrosEditor({ open, onClose }) {
  const dialogRef = useRef(null)
  const lastFocusedRef = useRef(null)
  // Bumped on each open so the embedded body re-reads from storage.
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    if (!open) return
    setRevision(r => r + 1)
    lastFocusedRef.current = document.activeElement
    const id = window.requestAnimationFrame(() => dialogRef.current?.focus())
    return () => {
      window.cancelAnimationFrame(id)
      if (lastFocusedRef.current?.focus)
        try { lastFocusedRef.current.focus() } catch { /* ignore */ }
    }
  }, [open])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      e.preventDefault()
      onClose()
    }
  }, [onClose])

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
        aria-label="Macros and engines editor"
        tabIndex={-1}
        className={classes['dialog']}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className={classes['header']}>
          <h2>Macros / commands / engines</h2>
          <button
            type="button"
            className={classes['closeBtn']}
            onClick={onClose}
            aria-label="Close editor"
            title="Close (Esc)"
          >
            <FiX size="1.25em" />
          </button>
        </div>

        <MacrosEditorBody revision={revision} />
      </div>
    </div>
  )
}

export default memo(MacrosEditor)
