// The two ways every modal dialog closes besides its button.

/** For a dialog's `onKeyDown`. */
export function closeOnEscape(e, onClose) {
  if (e.key !== 'Escape') return
  e.preventDefault()
  onClose()
}

// For the backdrop's `onPointerDown`, not click: a text selection dragged out of the dialog ends on the backdrop and must not
// close it. preventDefault keeps the browser from moving focus to <body> after our handler returned it.
export function closeOnBackdrop(e, onClose) {
  if (e.target !== e.currentTarget) return
  e.preventDefault()
  onClose()
}
