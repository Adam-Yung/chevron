# src/answers/cityZones.js

Place table for `timezones.js`: ~80 cities plus single-zone countries and abbreviations, each mapped to an IANA zone so DST comes from Intl and never from our code.

- A place that spans several zones (usa, russia, brazil, canada, australia) is deliberately absent: no answer beats a wrong one.
- Abbreviations map to the region's civil zone, so `pst` in July shows daylight time. CST is omitted (China, Cuba, US Central), as are other clashing readings (BST as Bangladesh); IST is read as India, which is how it is overwhelmingly typed.
- Several names can share a row (`delhi`, `mumbai`, `india` are one zone).
