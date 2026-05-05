import { useSyncExternalStore } from 'react'

/**
 * Reactive wrapper around `navigator.onLine`.
 *
 * Notes:
 * - `navigator.onLine === true` only proves there's a network adapter
 *   present; the device might still be offline from the internet's
 *   point of view. We treat `false` as a definitive "offline" signal
 *   and `true` as "probably online" — the surrounding code must still
 *   handle fetch failures.
 * - Uses `useSyncExternalStore` so React 18 / 19's concurrent renders
 *   see a consistent value within a single render pass.
 */

function subscribe(onChange) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

function getSnapshot() {
  // Some embedded webviews don't define `navigator.onLine`; assume
  // online so we don't show a misleading offline pill.
  return typeof navigator === 'undefined' || navigator.onLine !== false
}

function getServerSnapshot() {
  return true
}

export default function useOnlineStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
