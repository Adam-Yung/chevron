# src/features/stage/useReducedMotion.js

The stylesheet's reduced-motion rule cannot reach the canvas morph, so the stage reads the preference and runs at speed zero.
Without it the fill appeared at once while the stripe still sprang past it.
