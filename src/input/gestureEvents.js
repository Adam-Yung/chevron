// A swipe in the global touch handler pages the lazily loaded sites menu through this window event, so no ref has to cross the
// lazy boundary.

export const GESTURE_MACRO_PAGE = 'chevron:macro-page' // detail: { dir: '+' | '-' }

export function emitMacroPage(dir) {
  window.dispatchEvent(new CustomEvent(GESTURE_MACRO_PAGE, { detail: { dir } }))
}
