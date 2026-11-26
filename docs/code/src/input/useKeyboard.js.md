# src/input/useKeyboard.js

The single global key listener, in the capture phase so it decides before any field or panel sees the key.
- Shift toggles the menu on a quick release with no other key in between. Acting on Shift keydown (the old behaviour) opened the
  menu whenever someone typed a capital letter.
- Ctrl held is mirrored into the store (`forceEngine`) and cleared on window blur, so it cannot stick after Ctrl+Tab.
- IME composition keys are ignored.
