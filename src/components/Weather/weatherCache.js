import LocalStorageObject from '../../classes/localStorage/localStorageObject'

// Phase 8d: TTL-based localStorage cache for OpenWeatherMap responses.
// Serves stale data optimistically while a background refetch is in
// flight, matching the "stale-while-revalidate" pattern used by the
// settings store.
//
// TTLs:
//   current  — 10 minutes (weather changes slowly)
//   forecast — 60 minutes (3-hour buckets; re-fetching more often wastes quota)
//
// Shape stored:
//   { current:  { data: <OWM payload>, fetchedAt: <ms> } | null,
//     forecast: { data: <OWM payload>, fetchedAt: <ms> } | null }

const KEY = 'chevron.weather'
const TTL_CURRENT_MS  = 10 * 60_000
const TTL_FORECAST_MS = 60 * 60_000

function read() {
  return LocalStorageObject.read(KEY) ?? { current: null, forecast: null }
}

function write(value) {
  LocalStorageObject.write(KEY, value)
}

export function getCachedCurrent() {
  const { current } = read()
  if (!current) return null
  if (Date.now() - current.fetchedAt > TTL_CURRENT_MS) return { stale: true, data: current.data }
  return { stale: false, data: current.data }
}

export function getCachedForecast() {
  const { forecast } = read()
  if (!forecast) return null
  if (Date.now() - forecast.fetchedAt > TTL_FORECAST_MS) return { stale: true, data: forecast.data }
  return { stale: false, data: forecast.data }
}

export function setCachedCurrent(data) {
  const cache = read()
  write({ ...cache, current: { data, fetchedAt: Date.now() } })
}

export function setCachedForecast(data) {
  const cache = read()
  write({ ...cache, forecast: { data, fetchedAt: Date.now() } })
}

export function clearWeatherCache() {
  write({ current: null, forecast: null })
}
