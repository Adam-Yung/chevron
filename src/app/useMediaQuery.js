import { useCallback, useSyncExternalStore } from 'react'

const media = query => window.matchMedia?.(query)

/** Whether `query` matches, following changes. False where `matchMedia` is missing. */
export default function useMediaQuery(query) {
  const subscribe = useCallback(onChange => {
    const list = media(query)
    list?.addEventListener('change', onChange)
    return () => list?.removeEventListener('change', onChange)
  }, [query])
  return useSyncExternalStore(subscribe, () => Boolean(media(query)?.matches))
}
