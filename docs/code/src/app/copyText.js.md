# src/app/copyText.js

Copy for instant answers. The async clipboard API is refused on some `file://` pages and older embedded browsers; the hidden-textarea fallback keeps Enter-to-copy working there. Resolves a boolean so the caller can say whether it worked.
