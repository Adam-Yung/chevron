# Scripts

| Script | What it does |
|--------|--------------|
| `verify.sh` | The commit gate |
| `add-icon.mjs` | Owner-run: fetch a site's icon into `public/icons.js`; its parts are in `icons/` |
| `e2e/run.mjs` | End-to-end runner; it loads every spec in `e2e/specs/` by folder |
| `perf/load.mjs` | Load-time measurement |
| `owner/install-deps.sh`, `owner/add-graduate-font.sh` | Downloads only the owner runs |

Specs, loaded by folder: `boot.mjs`, `hosted-boot.mjs`, `hosted-offline.mjs`, `macros-editor.mjs`, `panels.mjs`, `settings.mjs`,
`stuck-states.mjs`.

`gate/lint/` holds the analyzers of the de-slop gates (`npm ci --prefix scripts/gate/lint`); `gate/baselines/` holds their counts,
which may only shrink.
