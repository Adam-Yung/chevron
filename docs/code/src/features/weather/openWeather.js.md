# src/features/weather/openWeather.js

Thin fetch wrappers for the three OpenWeatherMap free-tier endpoints (geocode, current, 5-day forecast). `/onecall` is paid and
deliberately unused.

- Every request has its own 8 s deadline (`getJson`) on top of the caller's signal. The earlier version armed a timer that only
  called `throwIfAborted`, which never aborted anything, so a stalled connection hung forever.
- The caller's abort is forwarded and the listener removed afterwards, so a long-lived signal does not accumulate listeners.
- Errors are plain `Error`s with the HTTP status in the message; callers swallow them (weather is decoration) except the settings
  geocoder, which shows the message.

Reviewed: 3da66c42
