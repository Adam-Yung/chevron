# src/lib/formatDate.js

Formatter for the "Time format" setting, replacing the `dateformat` dependency. Tokens are a strict subset with the same meaning (`HH`, `h`, `mm`, `TT`...), so formats saved by users still work.

Quoted text (single or double quotes) is emitted literally. Unknown characters pass through. Tokens are matched longest-first by the regex order.
