# src/answers/query.js

Shared front door for every answer family: `normaliseQuery` lower-cases, collapses whitespace and strips conversational filler
("what is", "calculate", "convert", trailing `?` or `=`), so "What is 15% of 80?" and "15% of 80" reach the grammars identically.

- Returns `''` for multi-line or over-long input; callers treat falsy as "not an instant question". The 120 character cap keeps every regex cheap on pasted text.
- `AMOUNT_SOURCE` accepts `1,000.5` style thousands separators and `.5`; sign handling belongs to each grammar because `-` is an operator in the calculator.
