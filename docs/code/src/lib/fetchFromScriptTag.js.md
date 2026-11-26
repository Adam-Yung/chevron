# src/lib/fetchFromScriptTag.js

JSONP through an injected script tag, needed for Google suggestions: the endpoint sends no CORS headers and the page may run from file://.

- The caller must pass a unique callback name per call. A name already on `window` rejects rather than overwriting, so two requests can never resolve each other.
- One `settle` path handles success, load error, timeout and a failed insert: it clears the timer, deletes the global and removes the script. Anything else leaks a node and a global per keystroke while offline.
- A late response after a timeout is ignored.
