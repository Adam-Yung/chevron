import { useEffect, useState } from 'react'

// Re-armed from each second boundary: a plain setInterval drifts, and the shown second could lag by up to a second.
function scheduleTick(timer, onTick) {
  timer.id = setTimeout(() => {
    onTick(new Date())
    scheduleTick(timer, onTick)
  }, 1000 - (Date.now() % 1000))
}

function startTicking(timer, onTick) {
  onTick(new Date())
  scheduleTick(timer, onTick)
}

// Paused while the tab is hidden; on return it shows the current time at once.
const visibilityHandler = (timer, onTick) => () => {
  clearTimeout(timer.id)
  if (document.visibilityState !== 'hidden') startTicking(timer, onTick)
}

/** The current `Date`, updated once per visible second. */
export default function useClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = { id: undefined }
    // Only tick if we start out visible; otherwise wait for the tab to become visible.
    if (document.visibilityState === 'visible') startTicking(timer, setNow)
    const onVisibility = visibilityHandler(timer, setNow)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearTimeout(timer.id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return now
}
