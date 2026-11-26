# src/features/macros/MacrosMenu.jsx

The grid of pinned sites. All key handling lives in the key router; this only renders and pages.
- The keyboard cursor (store `menuCursor`) moves Splide to the cursor's page.
- Splide's own keyboard and wheel are off: arrows belong to the router, horizontal trackpad scroll is accumulated here so one swipe
  is one page, and on touch the app's swipe handler pages instead of Splide's drag.
- The grid is rebuilt (keyed) when the filter changes so the cards' entrance stagger replays and paging restarts at page one.
