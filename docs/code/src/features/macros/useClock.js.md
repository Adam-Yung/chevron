# src/features/macros/useClock.js

A shared clock that ticks on the second boundary and pauses while the tab is hidden, so an open background tab costs nothing.

Each tick is a `setTimeout` to the next second boundary, because a plain `setInterval(..., 1000)` drifts and the shown second
could lag by almost a second. On becoming visible it shows the current time at once.
