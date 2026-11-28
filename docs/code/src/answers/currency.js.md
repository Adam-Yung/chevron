# src/answers/currency.js

Live currency conversion, the only answer family that touches the network (`https://open.er-api.com/v6/latest/<BASE>`).

- `looksLikeCurrency` is the cheap synchronous gate the search code calls before scheduling a fetch: both sides must be known codes, aliases (`yen`, `bucks`, `euro`) or symbols (`$ € £ ¥ ₹`), and they must differ.
- Rates are cached per base currency for 5 minutes, because one response holds every target and the user re-types amounts constantly. Failures are never cached.
- `currencyAnswer` resolves to null for every failure (HTTP, JSON, timeout, missing target). It rejects only with AbortError when the caller's signal aborts, so stale lookups can be dropped.
  The 5 second timeout deliberately yields null, not an error, so a slow API cannot look like a cancelled search.
- Amounts show two decimals; sub-unit results (1 yen in USD) keep three significant digits.
- `clearCurrencyCache` exists for tests only. `fetchImpl` is injectable for the same reason.
- `withDeadline` owns the abort plumbing: the caller's signal is forwarded with an explicit `undefined` reason, because passing the abort event
  through would make it the reason and the request would no longer reject with AbortError.
