import { useSyncExternalStore } from 'react'

function subscribe(onChange) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

// `onLine === false` is a reliable "offline"; `true` only means an adapter exists, so callers must still survive failed fetches.
// Webviews without the property count as online rather than showing a misleading pill.
function getSnapshot() {
  return typeof navigator === 'undefined' || navigator.onLine !== false
}

/** Reactive `navigator.onLine`. `useSyncExternalStore` keeps concurrent renders on one consistent value. */
export default function useOnlineStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true)
}
