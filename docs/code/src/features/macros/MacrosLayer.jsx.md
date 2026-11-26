# src/features/macros/MacrosLayer.jsx

Clock above the bar, sites below it. The menu chunk is prefetched when the browser is idle and, once mounted, kept mounted so
reopening is instant; while closed the layer is `inert`. It remounts the menu on every reset (`epoch`) so a launch never leaves a card
in a pressed state.
