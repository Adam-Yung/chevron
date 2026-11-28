import { useCallback, useEffect, useRef } from 'react'

export const AUTOSAVE_DELAY = 800

// Debounced `save(value)` (true when it persisted) while `valid`, flushed on unmount and page hide so no edit is lost.
// `markClean(value)` records a value persisted by other means.
export function useAutosave({ value, valid, save, delay = AUTOSAVE_DELAY }) {
  const timer = useRef(null)
  const baseline = useRef(value)
  const latest = useRef({ value, valid, save })
  latest.current = { value, valid, save }

  const flush = useCallback(() => {
    clearTimeout(timer.current)
    const { value: current, valid: ok, save: persist } = latest.current
    if (!ok || current === baseline.current) return
    if (persist(current)) baseline.current = current
  }, [])

  useEffect(() => {
    if (!valid || value === baseline.current) return undefined
    const id = setTimeout(flush, delay)
    timer.current = id
    return () => clearTimeout(id)
  }, [value, valid, delay, flush])

  useEffect(() => {
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
      flush()
    }
  }, [flush])

  const markClean = useCallback(next => {
    clearTimeout(timer.current)
    baseline.current = next
  }, [])

  return { markClean }
}
