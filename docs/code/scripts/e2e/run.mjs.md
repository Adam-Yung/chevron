# scripts/e2e/run.mjs

A deliberately small runner on `playwright-core` instead of `@playwright/test`: one library, no test-runner dependency to install,
and the specs are plain async functions keyed by name in `scripts/e2e/specs/*.mjs`.

- Each spec gets a fresh browser context (`lib/app.mjs`), so localStorage and service-worker state never leak between specs.
- A spec fails on any uncaught page error even if its assertions pass: stuck states usually start as a swallowed exception.
- On failure a screenshot lands in `dist/` (ignored) for inspection.
- It loads the static build because that is the profile most users run (release zip, `file://`, local server).
