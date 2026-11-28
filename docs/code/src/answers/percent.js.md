# src/answers/percent.js

Percent phrases that need words, which the calculator cannot express: `15% of 80`, `20% off 80`, `20 is what percent of 80`, `what percent of 80 is 20`.
`80 + 15%` stays in `calculator.js` because it is an expression.

Rules are a small table of regex + formula; the two "what percent" rules divide, so a zero divisor returns null instead of Infinity.
The filler "what is" is removed earlier by `normaliseQuery`. `%`, `percent` and `pct` are interchangeable.

Reviewed: f5448ce3
