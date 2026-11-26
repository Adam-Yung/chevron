# src/features/status/useOnlineStatus.js

`navigator.onLine` as an external store. `false` is trusted, `true` only means an adapter exists, so fetches still need their own
failure handling (see `src/features/weather/useWeather.js`).
