# src/lib/ensureProtocol.js

Prefixes `https://` (or the given protocol) when a URL has none. Used before `new URL`, which throws on bare hosts.
