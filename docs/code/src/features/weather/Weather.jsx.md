# src/features/weather/Weather.jsx

The top row when weather is configured: the clock, then temperature and icon, all one button that opens the modal.

- Default export, no props; `src/features/macros/ChevronTop.jsx` lazy-imports it so none of this is in the first-paint bundle.
- Before data exists it renders the bare clock and no placeholder text. The old "loading weather..." label appeared and vanished
  around each fetch and made the row change size.
- The unit symbol comes from settings; the modal receives the symbol, not the unit name, and derives colour bands from it.

Reviewed: c23df110
