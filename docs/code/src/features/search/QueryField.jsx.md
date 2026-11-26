# src/features/search/QueryField.jsx

The search textarea: the element that receives typing. It holds no logic of its own; text goes to the store on change, keys go to the
router. Empty, it is transparent but still focused so the first keystroke lands in it. The font shrinks to keep a long query on one line
(`useAdaptiveFontSize`), and the AI panel and suggestion list hang off it.

On mount it takes over from the first-paint shell's field (`src/app/bootShell.js`) in a layout effect: what was typed before
the app ran becomes the query, and focus moves in the same task, so no keystroke is dropped in between.
