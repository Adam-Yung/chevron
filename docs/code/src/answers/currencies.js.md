# src/answers/currencies.js

Allow-list of ISO 4217 codes plus a few crypto tickers. A query is a currency query only when both sides resolve to a code in this list,
which is what stops `apple to orange` from ever reaching the network. Unknown extras (BTC and friends) pass the gate but the rates API may have no rate,
which ends as "no answer".
