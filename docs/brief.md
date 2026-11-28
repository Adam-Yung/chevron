# Brief

> Drafted 2026-11-25 from `README.md` and `Maintainer.md` during the overnight re-architecture; **awaiting the owner's approval**.
> Lines marked *(inferred)* come from the owner's request that night, not from existing docs.

## Mission
Chevron replaces the browser's new-tab page with a keyboard-first launcher: type to search, jump to sites with short macros, get
instant answers (math, units, currency), ask an AI, glance at the time and weather. It runs from one HTML file, offline, with all
data in the browser.

## Who it serves
People who open many tabs a day and want to reach a site or an answer in a few keystrokes; also touch tablets used as start pages.

## Non-goals
Accounts, sync servers, telemetry, a browser extension, a news feed or any content stream.

## Anti-goals
- Slower than the browser's own new-tab page to become usable, or to leave after pressing Enter. *(inferred)*
- Any stuck state: text that stays after it was cleared or used, a mode that ignores keys, a screen that needs a reload. *(inferred)*
- Visual artifacts: half-finished animations, overlapping modes, flashes of the wrong colour. *(inferred)*
- Eye candy that delays or blocks input. *(inferred)*
- Losing a user's settings or macros.

## Priorities now
1. Never stuck: every state reachable is left by Esc, by finishing the action, or by returning to the tab. *(inferred)*
2. Fast: typing lands on the first frame; Enter navigates at once; transitions are short and interruptible. *(inferred)*
3. Useful: answers and destinations in fewer keystrokes than the browser's address bar. *(inferred)*
4. The chevron look, wherever it costs nothing against 1 to 3.

## Objectives
What every part of the code must serve (confirmed by the owner 2026-11-27).

| id | objective |
|----|-----------|
| `never-stuck` | Every state can be left; no animation or network call blocks input |
| `fast-launch` | Typing works on the first frame; Enter navigates at once |
| `search-and-go` | Search, macros, addresses, history, suggestions, the sites menu and dock |
| `answers` | Math, units, currency, time zones and AI inline |
| `glance` | Time and weather |
| `own-your-setup` | Settings and the macro editor, stored locally and never lost |
| `runs-anywhere` | Single HTML file, offline, hosted build, touch devices |
| `look` | The chevron look, where it costs nothing against the others |
| `dev-tooling` | Build, test, gate and release scripts |

## Where to look
`docs/status.md` (present state) · `docs/todo.md` (next work, in order) · `docs/decisions/` (settled calls) · `docs/README.md` (map).
