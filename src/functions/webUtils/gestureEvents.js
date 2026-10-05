// Lightweight cross-component signalling for touch gestures.
//
// App.jsx owns the global gesture engine (useGestures) but several targets of
// a swipe live inside lazy-loaded / separately-rendered components:
//   - the search textarea focus/blur lives in QueryField
//   - the macro-page carousel (Splide) lives in MacrosMenu
// Rather than hoist refs across the lazy boundary, App dispatches these
// window CustomEvents synchronously from inside the touch handler (preserving
// the user-gesture call stack so the virtual keyboard is allowed to open),
// and the owning component listens and acts.

export const GESTURE_FOCUS_SEARCH = 'chevron:focus-search'
export const GESTURE_BLUR_SEARCH  = 'chevron:blur-search'
export const GESTURE_MACRO_PAGE   = 'chevron:macro-page' // detail: { dir: '+' | '-' }

export function emitFocusSearch() {
  window.dispatchEvent(new CustomEvent(GESTURE_FOCUS_SEARCH))
}

export function emitBlurSearch() {
  window.dispatchEvent(new CustomEvent(GESTURE_BLUR_SEARCH))
}

export function emitMacroPage(dir) {
  window.dispatchEvent(new CustomEvent(GESTURE_MACRO_PAGE, { detail: { dir } }))
}
