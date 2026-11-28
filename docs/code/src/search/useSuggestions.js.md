# src/search/useSuggestions.js

Local sources (instant answers, macros, history) answer in the same render as the keystroke. Remote ones (Google, currency) start
after a short debounce, skip it entirely when cached, and are shown only if they belong to the current query, so a slow response can
never overwrite newer results.

One effect run owns one lookup: `requestRemote` starts both requests and `settleRemote` merges each into the state for its own query,
writing nothing once the run is aborted.
