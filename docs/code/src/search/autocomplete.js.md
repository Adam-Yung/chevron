# src/search/autocomplete.js

A small LRU cache of remote suggestions. Retyping or backspacing costs no request, and while a longer query is in flight the longest cached prefix, narrowed, keeps the list from blinking empty.
