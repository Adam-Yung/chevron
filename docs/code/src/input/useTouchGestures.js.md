# src/input/useTouchGestures.js

Swipes per view. Focusing the field happens inside the touch handler, the only place a mobile browser lets the keyboard open. Swipes that start in a scrollable panel are left to it.

`SWIPE_ACTS` maps view and direction to an act, `RUN` carries the act out. The finger's starting point lives in a `touch` object
shared by the start, end and cancel listeners.
