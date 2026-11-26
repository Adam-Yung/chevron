# src/search/SearchProvider.jsx

Suggestions are computed once and shared: the list renders them and the key handlers step through the very same array (via a ref, so handlers do not re-render on every keystroke).
