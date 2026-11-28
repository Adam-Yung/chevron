# src/app/LaunchOverlay.jsx

Decoration for a same-tab navigation. The navigation has already started (`useLaunch`) when this renders, so the disc that grows from
the card (or from the search blob) costs no latency; it only fills the time the browser spends loading the next page.

- `leaving.macro` names the site, looked up in every macro (not only pinned ones), for its colour and icon.
- From the sites menu or dock the disc starts at the card (`data-macro`). From search it starts on the left edge where the blob is,
  even when the site also has a (faded) dock badge, and carries the blob's scrolling banner and the site's name.
- The disc is a full-screen layer revealed by an animated `clip-path` circle, not a scaled circle, so the banner inside it is never
  stretched. Two rAFs separate the first paint at the origin from the grown state so the transition always runs.
- When `leaving` clears (page restored, timeout, user typing) it unmounts immediately.
