# src/features/weather/weatherCache.js

localStorage cache (`chevron.weather`) for OWM responses, with a TTL per kind: current 10 min, forecast 60 min.

- Entries carry the `place` string (`lat,lon,units`) they were fetched for. Reading with a different place returns null, so changing
  city or units can never flash the old city's weather. Reading without a place skips the check.
- Stale entries are returned flagged `stale: true` rather than dropped: the chip keeps showing them (marked "Cached data" in the modal)
  when offline or when the refetch fails.
- Corrupt or blocked storage reads as empty and writes are best-effort; the cache must never throw into render.
