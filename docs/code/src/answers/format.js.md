# src/answers/format.js

One number formatter for every answer so results look alike and never show float noise.

- Integers below 1e15 print exactly (a terabyte in bytes must not be rounded to 8 digits).
- Everything else goes through `toPrecision(12)` first to erase binary noise (0.1 + 0.2), then to the family's own significant digits (8 for conversions, 10 for the calculator).
- No thousands separators: answers are copied on Enter and pasted into other tools.
- Values at or above 1e15 or below 1e-6 fall back to JavaScript exponent notation.
