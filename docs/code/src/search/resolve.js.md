# src/search/resolve.js

What text means as a destination. Precedence: an instant-answer type (copied, not opened), then an exact macro trigger, then a macro
trigger followed by a command trigger the macro defines (longest trigger wins), then a URL, then a search. Ctrl (`forceEngine`) skips
macros and URLs. `node.js`, `setup.py` and similar file-like words are searches unless typed with a scheme or path. Tests:
`resolve.test.js`.
