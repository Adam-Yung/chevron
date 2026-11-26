# src/input/keyRouter.js

What every key does, as a pure function of (UI state, key, focus context). Its tests are the keyboard specification.

Precedence: Shift taps first; then a focused panel (`[data-keep-focus]` or any other editor) owns every key; an open overlay only
takes Escape; the sites menu has its own map (filter letters, Shift+letter hotkeys, arrows, Enter); otherwise the search map (Enter,
Alt/Cmd+Enter, Tab and arrows through suggestions, Shift+Delete, Space Space for AI, `?` on an empty field). A printable key with focus
elsewhere pulls focus to the field and lets the character through. Held Enter and Escape never repeat. A focused button or link
keeps Enter and Space, so keyboard users can press it.
