# src/storage/localStorageObject.js

Base for objects mirrored in `localStorage` (settings, search history, weather cache).

- Loading never throws. Invalid JSON is parked under `chevron.corrupt.<name>.<ms>` and the default takes over, so a damaged entry
  can no longer stop the app booting (it used to throw at import time). A storage that throws on read (blocked cookies) yields the
  default in memory.
- `write` and `read` stay raw and can throw; callers on a timer must catch (settings storage does).

Reviewed: e4c07d4f
