// OpenWeatherMap free-tier endpoints only; /onecall is paid.
const BASE = 'https://api.openweathermap.org'
const TIMEOUT_MS = 8000

const abortWith = (controller, signal) => () => controller.abort(signal.reason)

// A start page must never wait on a slow API, so every request carries its own deadline in addition to the caller's signal.
async function getJson(url, label, signal) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new Error(`${label} timed out`)), TIMEOUT_MS)
  const forward = abortWith(controller, signal)
  if (signal?.aborted) forward()
  signal?.addEventListener('abort', forward, { once: true })
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`${label} failed: ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', forward)
  }
}

/** Geocode a city name to up to five `{ name, lat, lon, country, state }` matches. */
export function geocodeCity(city, apiKey, signal) {
  const url = `${BASE}/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=5&appid=${apiKey}`
  return getJson(url, 'Geocode', signal)
}

/** Raw `/data/2.5/weather` payload for a lat/lon pair. */
export function fetchCurrentWeather(lat, lon, units, apiKey, signal) {
  const url = `${BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`
  return getJson(url, 'Weather fetch', signal)
}

/** Raw `/data/2.5/forecast` payload (5 days in 3-hour steps) for a lat/lon pair. */
export function fetchForecast(lat, lon, units, apiKey, signal) {
  const url = `${BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`
  return getJson(url, 'Forecast fetch', signal)
}
