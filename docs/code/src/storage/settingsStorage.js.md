# src/storage/settingsStorage.js

The `settings` key. API keys (`query.AI.apiKey`, `weather.apiKey`) are obfuscated at rest (`obfuscate.js`) and restored on load, on a
deep copy so the live object is never altered. A failed write (quota, blocked) is logged and swallowed: it runs from a debounce
timer and from `pagehide`, where an exception would be lost anyway, and the in-memory settings stay correct.
