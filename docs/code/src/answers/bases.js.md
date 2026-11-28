# src/answers/bases.js

Integer base conversion with BigInt, so long values (a 128-bit hex id) stay exact.

- Plain digits are always decimal. We never guess that `ff` is hex: `ff in decimal` gives no answer, `0xff in decimal` does.
- Source prefixes `0x`, `0b`, `0o`; targets `hex|hexadecimal`, `bin|binary`, `oct|octal`, `dec|decimal`, or `base N` for 2..36.
- Hex, binary and octal results keep their prefix (`0xff`) so the pasted value is unambiguous; decimal and other bases have none.
- A conversion to the base the value is already in returns null (it would show the query back to the user).
- Sources over 40 digits are ignored to bound BigInt work on pasted text.
- The label names the source base (`0xff (hex)`).
