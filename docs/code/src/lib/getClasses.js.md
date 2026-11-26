# src/lib/getClasses.js

Joins class names, dropping booleans so `cond && "x"` works. `undefined`, `null` and empty strings are not filtered; callers pass strings or booleans only.
