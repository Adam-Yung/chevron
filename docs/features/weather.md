# Weather

> Verified: 2026-11-28 00:04 · Sources: `src/features/weather/Weather.jsx`, `src/features/weather/useWeather.js`, `src/features/weather/openWeather.js`, `src/features/weather/weatherCache.js`, `src/features/weather/WeatherModal.jsx`, `src/features/weather/forecast.js`

An optional temperature chip next to the clock, with a forecast dialog behind it. Off until the user supplies an OpenWeatherMap key and a place.

## What the user sees
- The top row shows the clock; with weather configured and data available it becomes `clock · 14°C [icon]`, one button.
- Clicking it opens a dialog: city, current conditions with an animated backdrop, humidity, wind, visibility, feels-like, and a
  per-day high/low strip (up to the "forecast days" setting, 5 at most, 0 hides the strip).
- The dialog closes with Esc, the X, or a click on the backdrop; focus goes back to where it was.
- "Cached data" appears in the dialog when the data is older than its TTL or the browser is offline.

## Settings (Settings, Weather tab)
`weather.apiKey` (32 hex characters, free tier), `weather.city` with the Resolve button (fills `weather.lat` and `weather.lon`),
`weather.units` (metric, imperial, standard), `weather.forecastDays`. Resolving a city clears the cache.

## How it fetches
- Nothing is requested unless a valid key and coordinates exist, and never while offline.
- Requests happen after first paint from `src/features/weather/useWeather.js`; the page never waits for them.
- Cache: current conditions 10 minutes, forecast 60 minutes (`src/features/weather/weatherCache.js`). A reload inside the TTL makes
  no request. Entries remember the place and units they were fetched for, so changing either never shows the old place.
- Each request times out after 8 seconds. Any failure (offline, bad key, quota, timeout) is silent: the cached value stays, or the chip
  simply does not appear. Returning to a tab whose data went stale refetches.
- Two calls per refresh: `/data/2.5/weather` and `/data/2.5/forecast` on `api.openweathermap.org`. Geocoding uses `/geo/1.0/direct`
  from the Settings panel only.

## Limits
- Free-tier data only. Forecast is 3-hour steps grouped into local days; today is partial.
- The chip appears only once data exists, so the first-ever load shows the plain clock until the response arrives.

Tests: `src/features/weather/forecast.test.js`, `src/features/weather/weatherCache.test.js`, `src/features/weather/openWeather.test.js`,
`scripts/e2e/specs/panels.mjs`.
