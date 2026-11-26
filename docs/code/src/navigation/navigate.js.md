# src/navigation/navigate.js

`toHref` decides what may be opened: `javascript:`, `data:`, `vbscript:` and `file:` never; host-and-port text (`localhost:3000`) is
a host, not a scheme; local addresses get http, everything else https. `openDestination` must run inside the user's key or click
handler, because popup blockers only allow `window.open` there; the old code opened new tabs from an animation callback and got blocked.
