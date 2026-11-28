# src/search/autocomplete.js

A small cache of remote suggestions (the oldest stored entry goes first past 200). Retyping or backspacing costs no request, and while a longer query is in flight the longest cached prefix, narrowed, keeps the list from blinking empty.
