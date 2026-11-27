# src/features/chevron/morph.js

Interpolates between stage point arrays. A new target starts from the current points with a single animation loop. The old renderer
started a second rAF loop for every morph without stopping the first, so quick view changes made two loops fight over the shape (the
bent chevron left on screen after a fast Escape). Tests: `morph.test.js`.

`easeInOut` is the cubic form of the stage's `--ease-move`, so a bend stays in step with the CSS travel beside it.

A morph can carry further steps (`then`); any new morph or snap drops them, so an interrupted sequence never resumes.
