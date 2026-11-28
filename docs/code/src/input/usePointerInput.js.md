# src/input/usePointerInput.js

Mouse and trackpad: a click on empty space refocuses the field, or closes the sites menu when it is open (controls keep their focus), right-click toggles the menu (except on controls, and on the field while it holds text, where the browser's copy/paste menu
wins), and vertical
scroll opens or closes it. Scroll deltas accumulate with decay and a cooldown, so a resting finger or one long fling toggles once.

Delta accumulation is `wheelAccumulator.js`.
