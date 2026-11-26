# Instant answers

## 2026-11-26 · Silence beats a wrong card; a recursive-descent parser

**Decision:** an instant answer appears only when the query is unambiguously a calculation, conversion, percentage, base change,
currency or time-zone question. Anything doubtful (a bare number, `2024-11-25`, `9/11`, `ps5`, `the 1975`, ambiguous zone names such
as CST) gets no card. Around 220 ordinary searches are pinned as "must not answer" tests.

**Why:** a card for a normal search pushes the real suggestions down and, since Enter copies an answer instead of searching, turns
an ordinary search into a surprise. A missed answer costs one more keystroke (the search still runs); a wrong one costs trust.

**Parser:** the shunting-yard calculator was replaced by a recursive-descent parser (still no `eval`): functions, postfix `!` and `%`,
and percent-of-left-operand (`80 + 15%`) pushed the old design past the complexity limit and made precedence bugs likely.

**Weighed:** keeping the old parser plus special cases (more branches, same risk); a math library (a dependency and far more than a
start page needs).
