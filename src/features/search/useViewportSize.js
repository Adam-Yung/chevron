import { useSyncExternalStore } from 'react'

let snapshot = { width: window.innerWidth, height: window.innerHeight }

function read() {
  const { innerWidth: width, innerHeight: height } = window
  if (width === snapshot.width && height === snapshot.height) return false
  snapshot = { width, height }
  return true
}

function subscribe(onChange) {
  let frame = 0
  const onResize = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      if (read()) onChange()
    })
  }
  // The size may have changed (from zero, in a tab loaded in the background) before anything was listening.
  if (read()) onChange()
  document.addEventListener('visibilitychange', onResize)
  window.addEventListener('resize', onResize)
  // Some Android browsers fire resize late or never on rotation.
  window.addEventListener('orientationchange', onResize)
  return () => {
    cancelAnimationFrame(frame)
    document.removeEventListener('visibilitychange', onResize)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('orientationchange', onResize)
  }
}

/** Viewport size, updated at most once per frame. */
export default function useViewportSize() {
  return useSyncExternalStore(subscribe, () => snapshot)
}
