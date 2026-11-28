# src/app/whenTabVisible.js

Builds the `visibilitychange` listener of the two callers that act only on return to the tab: the navigation release and the
weather refresh. The caller adds and removes it on `document`.
