# src/search/suggestions.js

Merging and ordering. Tiers: instant answers, an exact macro trigger, history, other macro prefixes, remote suggestions; relevance
orders within a tier. One entry per text (case-insensitive), the better tier winning. Selection is matched by value because the list
is rebuilt on every keystroke; stepping past either end returns to the typed text.
