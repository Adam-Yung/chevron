# src/answers/units/index.js

Parser and engine for `<amount> <unit> in|to|into|as <unit>`.

- One alias map covers all families. A pair converts only inside a family both sides belong to, so `1 pt in cup` is volume and `5 in in cm` reads the first `in` as inches (the separator regex is lazy on the left unit).
- An amount is mandatory: `km to mi` gives no card, and so does `5 ft` (no target). Picking a default target would be wrong as often as right.
- Both units must be known: `5 apples to oranges`, `iphone 15 to 16` and `1080p to 4k` fall through to a normal search.
- Temperatures below absolute zero return null.
- `convertUnits(query, families)` can be limited to families.
