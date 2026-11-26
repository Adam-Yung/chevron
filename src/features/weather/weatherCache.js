import LocalStorageObject from '../../storage/localStorageObject'

const KEY = 'chevron.weather'
const TTL_CURRENT_MS = 10 * 60_000
// Forecast buckets are 3 hours wide, so refetching more often than hourly only burns quota.
const TTL_FORECAST_MS = 60 * 60_000

function read() {
  try {
    return LocalStorageObject.read(KEY) ?? {}
  } catch {
    return {}
  }
}

function write(value) {
  try {
    LocalStorageObject.write(KEY, value)
  } catch { /* storage full or blocked: weather just refetches next time */ }
}

// An entry remembers the place it was fetched for, so changing city or units never shows the old place's weather.
function get(name, ttl, place) {
  const entry = read()[name]
  if (!entry || (place !== undefined && entry.place !== place)) return null
  return { stale: Date.now() - entry.fetchedAt > ttl, data: entry.data }
}

function set(name, data, place) {
  write({ ...read(), [name]: { data, place, fetchedAt: Date.now() } })
}

export const getCachedCurrent = place => get('current', TTL_CURRENT_MS, place)
export const getCachedForecast = place => get('forecast', TTL_FORECAST_MS, place)
export const setCachedCurrent = (data, place) => set('current', data, place)
export const setCachedForecast = (data, place) => set('forecast', data, place)

export function clearWeatherCache() {
  write({})
}
