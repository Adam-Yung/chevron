# Gate and scripts

> Verified: 2026-11-28 00:12 · Sources: `scripts/verify.sh`, `scripts/e2e/run.mjs`, `scripts/e2e/lib/app.mjs`, `scripts/perf/load.mjs`, `scripts/owner/install-deps.sh`, `scripts/owner/add-graduate-font.sh`, `.eslintrc.cjs`
> Serves: `dev-tooling`
> Owns: `scripts/verify.sh`, `scripts/e2e/**`, `scripts/perf/**`, `scripts/owner/**`, `.eslintrc.cjs`

The commit gate, the end-to-end suite, a load-time measurement and two owner-run scripts. How to run them is in
`docs/guides/development.md`.

## What is here
- `scripts/verify.sh`: tests, lint, structure limits, both builds, e2e, doc checks and the de-slop ratchets.
- `scripts/e2e/run.mjs`: Playwright specs against the built page, with every outside request stubbed.
- `scripts/perf/load.mjs`: manual load timings, not part of the gate.
- `scripts/owner/install-deps.sh`, `scripts/owner/add-graduate-font.sh`: downloads only the owner runs. Both have already been
  applied to this tree.

## Rules that must hold
- No gate step reaches the network.
