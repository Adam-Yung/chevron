import { useEffect, useState } from 'react'

/**
 * A wall-clock tick that:
 *  - aligns updates to the real second boundary (plain setInterval(…,1000)
 *    drifts, so the displayed second can lag by up to ~1s), and
 *  - pauses while the tab is hidden (no wasted re-renders in background
 *    tabs), snapping to the current time immediately on becoming visible.
 *
 * Returns the current `Date`, updated once per visible second.
 */
export default function useClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timeoutId

    // Schedule the next tick exactly on the upcoming second boundary.
    const scheduleNextTick = () => {
      const msUntilNextSecond = 1000 - (Date.now() % 1000)
      timeoutId = setTimeout(() => {
        setNow(new Date())
        scheduleNextTick()
      }, msUntilNextSecond)
    }

    const start = () => {
      setNow(new Date())
      scheduleNextTick()
    }

    const stop = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = undefined
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stop()
      } else {
        stop()
        start()
      }
    }

    // Only run the ticker if we start out visible; otherwise wait for the
    // tab to become visible.
    if (document.visibilityState === 'visible') {
      start()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return now
}
