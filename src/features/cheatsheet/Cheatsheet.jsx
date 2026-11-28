import { memo, useEffect, useRef } from 'react'
import { FiX } from 'react-icons/fi'
import { closeOnBackdrop, closeOnEscape } from '../../app/dialogEvents'
import ShortcutTable from './ShortcutTable'
import { SHORTCUT_SECTIONS } from './shortcuts'
import classes from './Cheatsheet.module.css'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

// Typing resumes in the search field after closing, even when the sheet was opened from the corner button.
function restoreFocus(previous) {
  const typable = previous?.isConnected && (previous.matches('input, textarea') || previous.isContentEditable)
  const target = typable ? previous : document.querySelector('[role="combobox"]')
  target?.focus()
}

function useDialogFocus(open) {
  const dialogRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement
    dialogRef.current?.focus()
    return () => restoreFocus(previous)
  }, [open])
  return dialogRef
}

// The dialog has one or two tab stops, so Tab wraps inside it instead of reaching the page behind the backdrop.
function wrapTab(e, dialog) {
  const stops = dialog?.querySelectorAll(FOCUSABLE) ?? []
  if (!stops.length) return
  const edge = e.shiftKey ? stops[0] : stops[stops.length - 1]
  if (document.activeElement !== edge) return
  e.preventDefault()
  ;(e.shiftKey ? stops[stops.length - 1] : stops[0]).focus()
}

const onDialogKeyDown = (dialogRef, onClose) => e => {
  if (e.key === 'Tab') return wrapTab(e, dialogRef.current)
  closeOnEscape(e, onClose)
}

function Cheatsheet({ open, onClose }) {
  const dialogRef = useDialogFocus(open)
  if (!open) return null

  return (
    <div
      className={classes['backdrop']}
      onPointerDown={e => closeOnBackdrop(e, onClose)}
      onKeyDown={onDialogKeyDown(dialogRef, onClose)}
      data-keep-focus="true">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" tabIndex={-1} className={classes['dialog']}>
        <header className={classes['header']}>
          <h2 className={classes['title']}>Keyboard shortcuts</h2>
          <button type="button" className={classes['closeButton']} onClick={onClose} aria-label="Close cheatsheet" title="Close (Esc)">
            <FiX size="1.25em" />
          </button>
        </header>
        <div className={classes['body']}>
          {SHORTCUT_SECTIONS.map(section => <ShortcutTable key={section.title} section={section} />)}
        </div>
      </div>
    </div>
  )
}

export default memo(Cheatsheet)
