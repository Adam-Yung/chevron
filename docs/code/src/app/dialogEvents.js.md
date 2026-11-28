# src/app/dialogEvents.js

Escape and backdrop closing shared by the cheatsheet and the weather dialog. Both `preventDefault`, so the browser does not move
focus to `<body>` after focus was handed back. The backdrop closes on `pointerdown`, not click: a text selection dragged out of
the dialog ends on the backdrop and must not close it.
