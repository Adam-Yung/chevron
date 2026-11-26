import { useSyncExternalStore } from 'react'

let snapshot = { width: window.innerWidth, height: window.innerHeight }

function subscribe(onChange) {
  let frame = 0
  const onResize = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      snapshot = { width: window.innerWidth, height: window.innerHeight }
      onChange()
    })
  }
  window.addEventListener('resize', onResize)
  // Some Android browsers fire resize late or never on rotation.
  window.addEventListener('orientationchange', onResize)
  return () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('orientationchange', onResize)
  }
}

/** Viewport size, updated at most once per frame. */
export default function useViewportSize() {
  return useSyncExternalStore(subscribe, () => snapshot)
}
