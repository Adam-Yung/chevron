// The first-paint shell from index.html, handed over to the app. docs/code/src/app/bootShell.js.md explains the timing.
const SHELL_ID = 'boot-shell'
const INPUT_ID = 'boot-input'

// Takes what was typed into the shell's field before the app mounted, and removes the field. Returns '' after the first call.
/** @returns {string} */
export function takeBootInput(doc = document) {
  const field = doc.getElementById(INPUT_ID)
  if (!field) return ''
  const text = field.value
  field.remove()
  return text
}

// Removes the shell's chevron: once the app's own is on screen, or as soon as the view leaves idle, so the static idle chevron
// can never sit over a different view.
export function dismissBootShell(doc = document) {
  doc.getElementById(SHELL_ID)?.remove()
}
