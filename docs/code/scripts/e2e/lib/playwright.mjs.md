# scripts/e2e/lib/playwright.mjs

Resolves `playwright-core` without installing anything. Order: `$PLAYWRIGHT_CORE`, then the path written in the untracked
`scripts/e2e/playwright-path.local` (a machine-specific copy), then the project's own `node_modules` once the owner has run
`scripts/owner/install-deps.sh --run`. Returns `null` rather than throwing so the runner can print the remedy.
