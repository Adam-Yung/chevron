# src/answers/calculator.js

Calculator behind the answer card. A hand-written recursive-descent parser: no `eval`, no `Function`.
It replaced a shunting-yard parser because functions, postfix `!`/`%`, implicit multiplication and percent-of-left-operand
pushed that design past the complexity limit; precedence (lowest to highest) is `+ -`, `* / x ×  ÷` and implicit product, unary minus, `^` (right associative), postfix `! %`.

## When it answers (the false-positive rules matter more than the maths)
`calculate` returns null unless the text is clearly math: it needs a binary operator, a function call, `^`, `!`, or a parenthesised product.
So `42`, `pi`, `-5`, `100%`, `(5)`, `2pi` give no card. Any unknown word makes the whole query null (`iphone 15 + 1`, `c++ tutorial`, `1080p`, `ps5`).
Unspaced digit chains that look like dates, phone numbers or fractions (`2024-11-25`, `555-1234`, `2020-2021`, `9/11`, `12/25/2024`) are rejected;
spell them with spaces (`9 / 11`) to calculate. `0xff` style literals are left for `bases.js`.

## Semantics worth knowing
- `x` is multiplication only as a standalone word between operands (`2 x 3`, `2x3`); `**` is `^`.
- `%` is a postfix divide by 100, except directly after `+` or `-`, where it means a percentage of the left operand: `80 + 15%` is 92, `200 * 15%` is 30.
- Trig is in radians. `log` is base 10, `ln` natural. Residue below 1e-15 from sin/cos/tan snaps to 0 (`sin(pi)`).
- Factorial accepts integers 0..170 (171! overflows a double).
- Division by zero, domain errors (`sqrt(-1)`, `ln(0)`) and overflow throw an internal `CalcError`, caught in `calculate`, giving null: never NaN or Infinity.
- Nesting is capped at depth 40; deeper input (or a stack overflow) is null.
- `calculate` and `formatCalcResult` keep their old signatures for `src/search/useSuggestions.js`.
