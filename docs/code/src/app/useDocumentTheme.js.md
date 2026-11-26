# src/app/useDocumentTheme.js

Settings leave React here: theme colours become CSS variables on `<html>`, the scheme and glass mode become body attributes, the
title is set. It also takes over the background colour painted by the pre-React script in `index.html`, which exists only to avoid a
flash of the wrong colour before the bundle runs.
