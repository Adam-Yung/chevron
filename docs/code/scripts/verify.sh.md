# scripts/verify.sh

The commit gate, run through `~/.claude-personal/framework/bin/gate`. Order matters only for speed: cheap checks first, the
end-to-end suite after both builds because it loads `dist/index.html`.

- The hosted build goes to `dist-hosted/` so the static build in `dist/` (what the end-to-end suite and `file://` users load) is the
  last one written.
- `LINT_DIRS` lists what is linted as a whole; `services/` is not in it. The structure rule (depth 3, complexity 12) applies to every
  touched `js`, `jsx` and `mjs` file regardless.
- The touched files reach eslint as an array, one per line of `touched.sh`, so a name with spaces stays one argument. The list is
  assigned first so that a failing `touched.sh` stops the gate.
- The de-slop ratchets run last, from the skill folder (not copied: CI does not run this script). Their settings are `.deslop.json`,
  their counts `scripts/gate/baselines/`, their analyzers `scripts/gate/lint/` (eslint 9 and jscpd, apart from the app's eslint 8).
  Install them with `npm ci --prefix scripts/gate/lint`.
- Every step is offline: the e2e suite stubs outside requests and finds `playwright-core` locally (`scripts/e2e/run.mjs`).
