# src/app/useLaunch.js

The only way the app opens a URL. Its job is that no path leaves the start page stuck:
- new tab (Alt/Cmd+Enter, middle click, or the "open in new tab" setting): open, then reset at once, so returning to this tab shows
  a blank page. The old code kept the page frozen until a visibility event that does not always fire.
- same tab: mark `leaving`; `src/navigation/useNavigationRelease.js` clears it if the page is restored or never unloads.
- blocked scheme: a notice, nothing else.
