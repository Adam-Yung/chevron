# src/search/suggestions.js

Merging and ordering. Tiers: instant answers, an exact macro trigger, history, other macro prefixes, remote suggestions; relevance
orders within a tier. One entry per text (case-insensitive), the better tier winning. Selection is matched by value because the list
is rebuilt on every keystroke; stepping past either end returns to the typed text.

`macroSuggestions` gives one entry per macro, using its shortest matching trigger as the text so that selecting it resolves to that macro.
`submitTarget` is what Enter acts on: the highlighted suggestion, else an instant answer at the top (typing `2+2` then Enter copies 4), else
the typed text.
