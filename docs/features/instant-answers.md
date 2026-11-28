# Instant answers

> Verified: 2026-11-28 00:12 · Sources: `src/answers/index.js`, `src/answers/calculator.js`, `src/answers/percent.js`, `src/answers/bases.js`, `src/answers/units/index.js`, `src/answers/units/tables.js`, `src/answers/timezones.js`, `src/answers/cityZones.js`, `src/answers/currency.js`, `src/answers/query.js`, `src/answers/format.js`
> Serves: `answers`
> Owns: `src/answers/**`

Type a question into the search box and Chevron answers it directly as the top suggestion. Pressing Enter copies the answer instead of searching.
Everything works offline except currency, which asks `open.er-api.com` for rates (cached for 5 minutes per base currency).

Matching is case-insensitive and tolerant of spacing. A leading `what is`, `what's`, `calculate`, `calc`, `compute`, `convert` and a trailing `?` or `=` are ignored.
Conversions accept `in`, `to`, `into` or `as`. Results have no thousands separators and no floating point noise (`0.1 + 0.2` is `0.3`).

The rule that shapes the whole feature: a false answer card on an ordinary search is worse than a missed answer. When unsure, nothing is shown.

## Calculator

| Example | Answer |
|---|---|
| `2+2`, `10 / 4`, `2 x 3`, `6 ÷ 3` | `4`, `2.5`, `6`, `2` |
| `2^10`, `2**3`, `(1+2)(3+4)`, `2(3+1)` | `1024`, `8`, `21`, `8` |
| `sqrt(16) * 2`, `cbrt(27)`, `abs(-4)`, `round(2.5)`, `floor(2.9)`, `ceil(2.1)` | `8`, `3`, `4`, `3`, `2`, `3` |
| `sin(pi/2)`, `cos(0)`, `tan(0)`, `asin(1)`, `acos(1)`, `atan(1)` (radians) | `1`, `1`, `0`, ... |
| `log(1000)` (base 10), `ln(e)`, `exp(0)` | `3`, `1`, `1` |
| `5!`, `170!` (integers 0 to 170) | `120`, `7.257415615e+306` |
| `200 * 15%`, `80 + 15%`, `80 - 20%` | `30`, `92`, `64` |

Constants are `pi` and `e`. `x`, `×`, `÷`, `−` work as operators; `**` is `^`.
There is no `eval`: the expression is parsed by a small hand-written parser.

Deliberately no answer for: a bare number or constant (`42`, `pi`, `-5`, `100%`), anything with an unknown word (`iphone 15 + 1`), division by zero, `sqrt(-1)`, overflow, `171!`,
and digit chains that look like dates, phone numbers or fractions typed without spaces (`2024-11-25`, `555-1234`, `9/11`, `24/7`). Write `9 / 11` with spaces to calculate it.

## Percent phrases

`15% of 80` (12), `what is 15% of 80`, `15 percent of 80`, `20% off 80` (64), `20 is what percent of 80` (25%), `what percent of 80 is 20` (25%).

## Unit conversion

A number and two known units of the same kind are required. `5 ft` alone or `km to mi` without a number gives no answer.

| Family | Units |
|---|---|
| Length | mm, cm, m, km, in, ft, yd, mi, nmi (and the written-out words, singular or plural) |
| Weight | mg, g, kg, t (tonne), oz, lb or lbs, st, short ton |
| Duration | ms, s, min, h, d, w, month, yr (months and years are averages: 30.4375 and 365.25 days) |
| Temperature | C, F, K; also `°C`, `celsius`, `fahrenheit`, `kelvin`, `degrees c` (below absolute zero gives no answer) |
| Volume | ml, l, tsp, tbsp, fl oz, cup, pint, quart, gallon (US sizes) |
| Area | m2 or m², km2, ft2 (or `sq ft`), acre, hectare |
| Speed | m/s, km/h (kph), mph, ft/s, knot |
| Data | bit, byte, KB, MB, GB, TB, PB (1000-based), KiB, MiB, GiB, TiB (1024-based), kbit, mbit, gbit |

Examples: `100 kg in lb` (220.46226 lb), `5 ft in cm`, `72 f to c`, `1 gib in mib` (1024 MiB), `60 mph in km/h`, `2 hours in minutes`, `1 acre in m2`.
Because matching ignores case, `kb`, `mb`, `gb` always mean bytes; write `kbit` or `bits` for bits.

## Number bases

`255 in hex` (`0xff`), `0xff in decimal` (255), `0b1010 to dec` (10), `255 in binary` (`0b11111111`), `8 in octal` (`0o10`), `255 in base 36`.
Plain digits are always decimal, so `ff in decimal` gives no answer. Hex, binary and octal results keep their `0x`, `0b`, `0o` prefix. Integers only, any length up to 40 digits.

## Time zones

- Current time: `time in tokyo`, `tokyo time`, `what time is it in tokyo`, `time in utc+5:30`, `time in asia/tokyo`.
- Converting: `3pm london to new york`, `15:00 utc in jst`, `noon pst to est`, `9am tokyo to los angeles` (the answer says `(previous day)` or `(next day)` when the date changes).
  The time needs am/pm, a colon, or `noon` / `midnight`; `3 london to tokyo` gives no answer.

Daylight saving comes from the browser's Intl data, using today's date in the source place. Places are about 80 major cities and single-zone countries (`japan`, `uk`, `india`), IANA names, offsets (`utc+9`),
and abbreviations UTC, GMT, PST/PDT/PT, MST/MDT/MT, EST/EDT/ET, CDT/CT, AKST, HST, BST, WET, CET/CEST, EET/EEST, MSK, SAST, IST (India), HKT, SGT, JST, KST, AWST, AEST/AEDT, NZST/NZDT.
Abbreviations mean the region, so `pst` in July shows Pacific daylight time. Ambiguous names are left out on purpose: CST, and countries with several zones (usa, russia, brazil, canada, australia).

## Currency

`100 usd to eur`, `usd to eur` (amount 1), `5 bucks to euros`, `$5 in yen`, `€10 in usd`, `1,000 gbp to jpy`.
Informal names (yen, yuan, bucks, quid, sterling, euro, rupee, franc, krona, won, baht, lira, peso, real, dinar, dirham, bitcoin, ethereum) map to ISO codes, and the symbols `$ € £ ¥ ₹` work.
Both sides must be known currency codes, so `apple to orange` never causes a request. The answer shows two decimals (`90.00 EUR`) and the caption shows the rate (`1 USD = 0.9 EUR`).
A failed or slow (over 5 seconds) request shows no answer.

## For maintainers

`src/answers/index.js` exports `ANSWER_TYPES`, `instantAnswers(query)` (synchronous, never throws) and, from `src/answers/currency.js`, `currencyAnswer` and `looksLikeCurrency`.
Each answer is `{ suggestion, type, relevance: 5000, label? }`. Types: `calculator`, `percent`, `unit`, `base`, `timezone`, `currency`.
Each family has its own table-driven tests next to it, including lists of ordinary searches that must stay silent; add every new false positive you meet to those lists.
