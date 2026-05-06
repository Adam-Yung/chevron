// OpenWeatherMap fetch wrappers for Phase 8d.
// All three functions share the same AbortController pattern used
// elsewhere in this codebase (currency fetch, autocomplete).
// Free-tier endpoints only — /onecall is paid, avoided.

const BASE = 'https://api.openweathermap.org'
const TIMEOUT_MS = 8000

function fetchWithTimeout(url, signal) {
  const timer = setTimeout(() => {
    // If an external signal aborts first, don't double-abort.
    if (!signal.aborted) signal.throwIfAborted?.()
  }, TIMEOUT_MS)
  return fetch(url, { signal }).finally(() => clearTimeout(timer))
}

/**
 * Geocode a city name → [{name, lat, lon, country, state}, …] (up to 5).
 * Used in the Settings weather tab to resolve coordinates once.
 */
export async function geocodeCity(city, apiKey, signal) {
  const url = `${BASE}/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=5&appid=${apiKey}`
  const res = await fetchWithTimeout(url, signal)
  if (!res.ok) throw new Error(`Geocode failed: ${res.status}`)
  return res.json()
}

/**
 * Current weather for a lat/lon pair.
 * Returns the raw /data/2.5/weather payload.
 */
export async function fetchCurrentWeather(lat, lon, units, apiKey, signal) {
  const url = `${BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`
  const res = await fetchWithTimeout(url, signal)
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`)
  return res.json()
}

/**
 * 5-day / 3-hour forecast for a lat/lon pair.
 * Returns the raw /data/2.5/forecast payload.
 */
export async function fetchForecast(lat, lon, units, apiKey, signal) {
  const url = `${BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`
  const res = await fetchWithTimeout(url, signal)
  if (!res.ok) throw new Error(`Forecast fetch failed: ${res.status}`)
  return res.json()
}
