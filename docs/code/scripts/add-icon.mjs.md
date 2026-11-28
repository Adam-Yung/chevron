# scripts/add-icon.mjs

Owner-run command line (`npm run icons`) that fetches an icon for each argument and adds it to `public/icons.js`, then rebuilds unless
`--no-build` is given. It reaches the network, so agents do not run it (owner download rule).

This file holds only the command line: arguments, progress output, the file read and write, and the rebuild. The rest is in
`scripts/icons/`: `names.mjs`, `svg.mjs` and `iconsFile.mjs` are pure, `sources.mjs` picks where to look, `fetch.mjs` does HTTP.

- Icons are fetched one argument at a time so the progress lines do not interleave; colour suggestions run in parallel afterwards.
- Tests: `test/addIcon.test.js` covers the modules with the network mocked.
