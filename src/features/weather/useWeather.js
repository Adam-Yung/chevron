import { useEffect, useState } from 'react'
import { fetchCurrentWeather, fetchForecast } from './openWeather'
import {
  getCachedCurrent, getCachedForecast,
  setCachedCurrent, setCachedForecast
} from './weatherCache'

// OWM keys are exactly 32 hex characters; anything else would only earn a 401.
const OWM_KEY_RE = /^[0-9a-f]{32}$/i

const SOURCES = [
  { fetch: fetchCurrentWeather, cached: getCachedCurrent, store: setCachedCurrent },
  { fetch: fetchForecast, cached: getCachedForecast, store: setCachedForecast }
]

// Refetch only what the TTL cache says is missing or stale; failures keep whatever is cached and stay silent.
async function refresh(source, { lat, lon, units, apiKey, place }, signal, onData) {
  const hit = source.cached(place)
  if (hit && !hit.stale) return
  try {
    const data = await source.fetch(lat, lon, units, apiKey, signal)
    if (signal.aborted) return
    source.store(data, place)
    onData({ stale: false, data })
  } catch { /* offline, quota, timeout: the cached value (if any) stays on screen */ }
}

/**
 * Current weather and forecast for the configured place. Reads the cache synchronously so the chip renders without a
 * network round trip, and fetches in an effect, after first paint, so it can never hold up boot.
 */
export default function useWeather({ apiKey, lat, lon, units, online }) {
  const place = `${lat},${lon},${units}`
  const [current, setCurrent] = useState(() => getCachedCurrent(place))
  const [forecast, setForecast] = useState(() => getCachedForecast(place))

  useEffect(() => {
    setCurrent(getCachedCurrent(place))
    setForecast(getCachedForecast(place))
    if (!online || !lat || !lon || !OWM_KEY_RE.test(apiKey)) return
    const controller = new AbortController()
    const params = { lat, lon, units, apiKey, place }
    const run = () => {
      refresh(SOURCES[0], params, controller.signal, setCurrent)
      refresh(SOURCES[1], params, controller.signal, setForecast)
    }
    run()
    // A start page can stay open for days; catch up when the tab is looked at again.
    const onVisible = () => { if (document.visibilityState === 'visible') run() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      controller.abort()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [place, apiKey, online, lat, lon, units])

  return { current, forecast, stale: Boolean(current?.stale) || !online }
}
