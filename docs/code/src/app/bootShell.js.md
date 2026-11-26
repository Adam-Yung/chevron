# src/app/bootShell.js

The app's side of the first-paint shell in `index.html`. The shell itself:

- **Why a shell:** on a cold visit over Slow 4G nothing contentful painted for about 4 s; the user saw a flat colour. The shell is
  the idle screen's chevron, drawn as inline SVG at the canvas's exact position, size, thickness and colour, so the moment React's
  canvas takes over cannot be seen. Pixel comparison of shell and app in light, dark, portrait and a custom theme differs only by
  anti-aliasing (`docs/decisions/load-speed.md`).
- **Why the head script reads settings:** the saved theme's background and chevron colour, and the chevron size and thickness, are
  applied before the first paint. Without saved settings the CSS defaults are the default theme's, light or dark from the OS, so a
  first visit in dark mode no longer flashes white.
- **Why a hidden textarea:** keys typed before React mounted were lost. `#boot-input` is focused at parse time (not on touch
  screens, where focusing would pop the keyboard) and its text is handed to the search field on mount (below).
  Enter is swallowed there: nothing can act on it yet, and it must not become a newline in the query.
- **Why the shell sits outside `#root`, above the app:** React replaces `#root`'s children on mount and `.app` paints an opaque
  background, so a shell inside or below it would vanish before the canvas has drawn. It is `pointer-events: none` and below the
  overlays' z-index.
- The hosted build moves the app stylesheet below the shell (`tools/vite/htmlTransforms.js`); the static build inlines everything.

The handover:

- **Two steps, not one:** the shell's field and its chevron leave at different moments. The field goes in `QueryField`'s layout
  effect, the same task in which React's field takes focus, so no keystroke falls between them. The chevron stays until the canvas
  has drawn the same shape under it (`useChevronPainter`'s first-frame callback). Removing both at mount showed a blank frame where
  the chevron belongs, for as long as the chevron worker took to load: a flash on every cold visit.
- **Why the view also dismisses it:** the shell can only draw the idle chevron. If the view leaves idle before the canvas reports
  (early typing, a worker that never loads), `Chevron` removes it at once, so a stale shape never sits over another view.
- **A worker that never loads:** `worker.onerror` dismisses the shell too, so a failed chunk leaves the screen without a chevron
  (the true state) rather than a static one that ignores later theme or colour-scheme changes.
- **Accepted trade-off:** text typed before mount is not shown until the app takes over (up to several seconds on Slow 4G); the
  field is invisible because echoing it would mean styling text outside the app. Escape before mount clears what was typed.
