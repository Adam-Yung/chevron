# src/features/weather/useWeather.js

Owns the weather data flow for the chip.

- State starts from the cache synchronously, so a returning user sees the chip on first render with no request.
- The fetch runs in an effect (after first paint) and only for entries the TTL cache reports missing or stale; two fresh entries mean
  zero network traffic. Current and forecast refresh independently and each failure is swallowed.
- Nothing is fetched while offline, without a 32-hex key, or without coordinates. Going back online re-runs the effect.
- A `visibilitychange` to visible re-checks the TTL, so a tab left open for days catches up when looked at.
- The effect's abort signal is checked before applying results, so a superseded place (user edited lat/lon) cannot overwrite newer data.

Reviewed: 47805a62
