# src/search/googleAutocomplete.js

Google suggestions over JSONP: the endpoint has no CORS headers and the page may run from `file://`. Callback names are unique per call (counter), and Google's own calculator rows are dropped because the offline instant answers replace them.
