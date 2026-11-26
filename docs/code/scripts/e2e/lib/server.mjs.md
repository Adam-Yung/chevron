# scripts/e2e/lib/server.mjs

Serves `dist/` on an ephemeral localhost port. Written in-house so the gate needs neither Python nor an npm server package, and so
two gate runs never collide on a fixed port. Path traversal is clamped to the served folder.
