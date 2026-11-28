# src/answers/index.js

Composes the offline answer families into the one entry point the search suggestion code calls: `instantAnswers(query)`.
Currency is re-exported separately because it needs the network.

- `ANSWER_TYPES` is the contract for "copy this on Enter instead of searching"; add a type here whenever a family can emit a new one.
- Each family is wrapped in try/catch: a bug in one parser must degrade to "no card", never to a broken search box.
- Families are meant to have disjoint grammars (each demands its own keywords or units), so more than one answer for a query is a grammar bug, not a feature.
- Types are coarse (all unit families share `unit`) because the app only needs to know "copy, don't search".
- An `Answer` is `{ suggestion, type, relevance, label? }`: `suggestion` is shown and copied, `type` is one of `ANSWER_TYPES`,
  `relevance` is 5000 for exact answers, `label` is a short caption such as `1 EUR = 1.0834 USD`.
- `instantAnswers` is synchronous; its only impurity is time zones reading the clock (`options.now` injects it).
