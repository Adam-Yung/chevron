# scripts/verify.sh

The commit gate, run through `~/.claude-personal/framework/bin/gate`. Order matters only for speed: cheap checks first, the
end-to-end suite after both builds because it loads `dist/index.html`.

- The hosted build goes to `dist-hosted/` so the static build in `dist/` (what the end-to-end suite and `file://` users load) is the
  last one written.
- `LINT_DIRS` is a ratchet while the re-architecture moves code: a directory joins once it has been rewritten to pass. The structure
  rule (depth 3, complexity 12) applies to every touched file regardless.
- Every step is offline: the e2e suite stubs outside requests and finds `playwright-core` locally (`scripts/e2e/run.mjs`).
