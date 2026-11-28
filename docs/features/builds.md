# Builds and serving

> Verified: 2026-11-28 00:12 · Sources: `vite.config.js`, `tools/vite/htmlTransforms.js`, `tools/vite/serviceWorker.js`, `services/install.cjs`, `services/serviceFiles.cjs`, `package.json`
> Serves: `runs-anywhere`, `fast-launch`
> Owns: `vite.config.js`, `tools/vite/**`, `services/install.cjs`, `services/serviceFiles.cjs`, `services/chevron-preview.service`, `services/chevron-preview.xml`, `services/com.chevron.preview.plist`

Two build profiles from one source tree, and an optional login service that serves the built page on this machine.

## What it does
- `npm run build`: one self-contained `dist/index.html` that runs from `file://`.
- `npm run build:hosted`: split chunks and a service worker, so repeat and offline visits load from the cache.
- `npm run install_mac_service`, `install_linux_service`, `install_windows_service`: register a service (launchd, systemd user
  unit, scheduled task) that runs `vite preview` on port 4173. It builds first if `dist/` is missing. Windows needs an
  administrator terminal.

## Rules that must hold
- The static build has no module scripts and fetches no local file at boot; `config.js` and `icons.js` come before the bundle.

## Limits
- No guide or README section mentions the services; the npm scripts are the only entry point.
- The service serves from this checkout and its installed packages.

## How to check it
`tools/vite/htmlTransforms.test.js`, `tools/vite/serviceWorker.test.js`, `test/installService.test.js`,
the `hosted-offline` end-to-end spec.
