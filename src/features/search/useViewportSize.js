import { useSyncExternalStore } from 'react'

let snapshot = { width: window.innerWidth, height: window.innerHeight }

function read() {
  const { innerWidth: width, innerHeight: height } = window
  if (width === snapshot.width && height === snapshot.height) return false
  snapshot = { width, height }
  return true
}

// At most one read per frame, however many events arrive; `pending.frame` is the one requested.
function readNextFrame(pending, onChange) {
  cancelAnimationFrame(pending.frame)
  pending.frame = requestAnimationFrame(() => {
    if (read()) onChange()
  })
}

function subscribe(onChange) {
  const pending = { frame: 0 }
  const onResize = readNextFrame.bind(null, pending, onChange)
  // The size may have changed (from zero, in a tab loaded in the background) before anything was listening.
  if (read()) onChange()
  document.addEventListener('visibilitychange', onResize)
  window.addEventListener('resize', onResize)
  // Some Android browsers fire resize late or never on rotation.
  window.addEventListener('orientationchange', onResize)
  return () => {
    cancelAnimationFrame(pending.frame)
    document.removeEventListener('visibilitychange', onResize)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('orientationchange', onResize)
  }
}

/** Viewport size, updated at most once per frame. */
export default function useViewportSize() {
  return useSyncExternalStore(subscribe, () => snapshot)
}
