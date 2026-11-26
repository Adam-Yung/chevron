# src/features/onboarding/GestureHints.jsx

First-run swipe hints for touch users. Shown only with a coarse pointer and no `touchHintsSeen` flag; fades on first touch or after 5 s,
then sets the flag. The overlay is `aria-hidden` and `pointer-events: none` in CSS, so it can never take input. Takes no props.

It also dismisses (and sets the flag) as soon as the UI view leaves `idle` (`useUi(s => s.view)` from `src/state/UiStore.jsx`): searching or opening the sites menu means the hints were understood, and they would otherwise overlap the query text and the menu bar.
