// Phase 8b: module-scope clock store. One interval lives for the page
// lifetime regardless of how many `<Time/>` instances mount/unmount.
//
// Why this exists: the previous Time.jsx ran a recursive setTimeout
// inside `useEffect([])`. When the surrounding macro/Chevron tree
// remounted (e.g. via the AnimatePresence `key={timestamp}` reset),
// the timer was torn down and rebuilt — and any setState fired between
// unmount and the next remount would silently no-op, leaving a stale
// reading on screen.
//
// Pattern: external mutable source paired with `useSyncExternalStore`.
// React 18's canonical way to subscribe to non-React state.

let now = new Date()
const listeners = new Set()

// Aligned to the second boundary so the displayed seconds tick over
// when wall-clock seconds tick over, not on a drifting offset. The
// initial timeout aligns; the subsequent setInterval keeps cadence.
let aligned = false
function tick() {
  now = new Date()
  for (const l of listeners) l()
  if (!aligned) {
    aligned = true
    setInterval(tick, 1000)
  }
}
setTimeout(tick, 1000 - (Date.now() % 1000))

export function subscribeTime(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getTime() {
  return now
}
