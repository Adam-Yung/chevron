# src/app/LaunchOverlay.jsx

Decoration for a same-tab navigation. The navigation has already started (`useLaunch`) when this renders, so the disc that grows from
the card (or from the search blob) costs no latency; it only fills the time the browser spends loading the next page.

- It reads `leaving.macro` to find the launching card by `data-macro`; without a card it grows from the left edge where the blob is.
- Only `transform` animates. Two rAFs separate the first paint at the origin from the grown state so the transition always runs.
- When `leaving` clears (page restored, timeout, user typing) it unmounts immediately.
