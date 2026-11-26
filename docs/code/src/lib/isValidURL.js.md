# src/lib/isValidURL.js

Regex check that a string looks like a host or URL (domain or IPv4, optional port, path, query, fragment). It rejects `localhost` and single-label hosts on purpose, so a search for a word never navigates.
