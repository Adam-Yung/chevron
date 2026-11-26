# src/answers/timezones.js

Offline time zone answers. Everything runs on Intl.DateTimeFormat with a cached formatter per zone (constructing one costs far more than formatting).

## Grammar
`time in tokyo`, `tokyo time`, `what time is it in tokyo`; and `<time> <place> to|in <place>` where the time carries am/pm, a colon, or is `noon`/`midnight`.
A bare `3 london to tokyo` is refused because `3` is not clearly a clock time. Places: the table in `cityZones.js`, IANA names (`asia/tokyo`), and offsets (`utc+5:30`, `gmt-5`).

## Conversion rule
"Today" means today in the source place (not in the viewer's zone). The wall time is turned into an instant with two offset passes so a DST boundary on that date is honoured;
the day shift is reported as `(next day)` / `(previous day)`. Output is 24-hour when the input was 24-hour without am/pm, otherwise 12-hour.
Date arithmetic is on UTC fields only, so the machine's own zone never leaks into the result. `now` is injectable for tests.
