# Offline behaviour

> Verified: 2026-11-28 00:04 · Sources: `src/features/status/OfflineIndicator.jsx`, `src/features/status/useOnlineStatus.js`, `src/features/weather/useWeather.js`

## The indicator
A small pill at the bottom left reads "Offline" while the browser reports no connection and fades out when it returns. It never
takes clicks or focus, and screen readers hear the change through a polite live region.

The browser's flag is trusted when it says offline; "online" only means a network adapter exists, so every feature below also copes
with requests that fail.

## What works without a connection
- The page itself, the clock, search typing, history, macros and settings: all local.
- Weather shows the last cached reading (marked "Cached data" in its dialog) and makes no request while offline; it refreshes when the
  connection returns.
- Searching hands the query to the search engine, which needs the network; suggestions and currency conversion fail quietly and
  simply do not appear.
- AI answers need the endpoint to be reachable; a local Ollama or LM Studio server works offline, a hosted provider shows its
  "Could not reach" message.
- The hosted build (`npm run build:hosted`) registers a service worker so the page loads offline; the single-file build is a local
  file and always loads.
