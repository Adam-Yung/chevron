# src/features/search/Suggestions.jsx

The listbox. Picking happens on mousedown with `preventDefault` so the field keeps focus. Options are keyed by type and text, never by
index, so a list rebuilt on every keystroke does not reuse the wrong element. A caption that only repeats the query is hidden.
