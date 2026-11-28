# src/lib/ensureProtocol.js

Prefixes `https://` (or the given protocol) unless the URL already starts with `http://` or `https://`. Used before `new URL`, which throws on bare hosts.
