import { useSyncExternalStore } from 'react'

const query = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')

function subscribe(onChange) {
  const media = query()
  media?.addEventListener('change', onChange)
  return () => media?.removeEventListener('change', onChange)
}

/** Whether the system asks for less motion. */
export default function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => Boolean(query()?.matches))
}
