# src/input/wheelAccumulator.js

`createWheelAccumulator(decayMs)` adds up wheel deltas for the two scroll gestures: the open/close toggle
(`usePointerInput.js`) and page turning in the sites menu (`../features/macros/MacrosMenu.jsx`). `add` restarts the pause timer
and returns the total, `reset` empties it after an action, `stop` clears the timer on cleanup. Thresholds and cooldowns stay
with the callers.
