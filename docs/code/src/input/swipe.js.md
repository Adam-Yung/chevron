# src/input/swipe.js

Swipe classification as a pure function so thresholds are tested without touch events. A fast flick counts at half the distance.

`classifySwipe` takes the finger's travel (`dx`, `dy` in px) and its duration `dt` in ms.
