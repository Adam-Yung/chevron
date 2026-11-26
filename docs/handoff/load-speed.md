# Handoff: hosted load speed (written 2026-11-26)

You are picking up load-speed work on the GitHub Pages build of Chevron, in a fresh context. Read in this order:
1. `AGENTS.md`
2. `docs/brief.md` (priority 2 is "fast: typing lands on the first frame")
3. `docs/decisions/load-speed.md`, which holds the measured baseline and the chosen direction
4. `docs/decisions/architecture.md`

Delete this file when its tasks are done or moved to `docs/todo.md`.

## Already done (on `master`, not pushed)
- `e133962`: the hosted build inlines `font.css`.
- `2c1a97e`: the service worker now serves `config.js?v=` and `icons.js?v=`. Before this, offline boot lost the default macros,
  engines and icons.
- `scripts/perf/load.mjs` measures cold and warm loads plus an offline reload; see `docs/code/scripts/perf/load.mjs.md`.

The live site still runs `03db0f4` until someone pushes, and pushing deploys. Ask the owner before pushing. Once it is pushed, run
`node scripts/perf/load.mjs https://adam-yung.github.io/chevron/` and add the new numbers to the decision file as a new dated entry.

## Tasks, in order

### 1. First-paint shell (feature: plan mode, recorded decision, reviewer agent at the end)
A cold visit on Slow 4G paints nothing contentful for about 3.9 s; the user sees only the theme colour. Put a static shell in
`index.html` that React replaces on mount.
- **Approaches to weigh:**
  - Inline HTML and CSS in `#root`, replaced by `createRoot().render`.
  - The same shell plus a real `<textarea>` that buffers keys typed before mount and hands them to the app. Keystrokes typed before
    mount are lost today, so this directly serves "typing lands on the first frame".
  - Build-time prerender. Already judged too costly; reopen it only with new evidence.
- **Must hold:**
  - No flash or jump at the moment React takes over, in light, dark and custom themes. Reuse the saved-theme script already in the
    `<head>` of `index.html`.
  - Works in the static `file://` build too.
  - Never blocks or swallows input (`AGENTS.md` invariants).
  - CLS stays 0.
- **Prove it:**
  - `scripts/perf/load.mjs` before and after, on the same target. FCP should move well ahead of "input visible".
  - An e2e spec in `scripts/e2e/specs/` that fails without the change.
- **Decide `font-display` here:** keep `swap` or move to `optional`. It decides what a slow first visit looks like.

### 2. Do `config.js` and `icons.js` delay the module start?
They are classic scripts at the end of `<body>`, and the module waits for them. Measure before changing anything:
1. Build hosted with them inlined, or moved after the module, in a scratch copy.
2. Compare with `load.mjs` on Slow 4G.

Change the hosted build only if the gain is real. The static build must keep them before the bundle (`AGENTS.md`).

### 3. The Cheatsheet chunk loads at boot
`src/app/App.jsx` always mounts the lazy `<Cheatsheet>`, so its chunk is fetched on every first visit. Mount it on first open
instead, the way `MacrosLayer` does. The MacrosMenu and Splide chunks are prefetched on idle on purpose. The gain is small: it only
matters on slow networks, where these chunks compete for bandwidth after mount.

### 4. Hosted e2e pass (`docs/todo.md` item 3)
Run the e2e suite against `dist-hosted` too. Add specs for the service-worker update path and for the offline reload. The
`offlineReload` routine in `scripts/perf/load.mjs` already does that reload correctly; it clears the HTTP cache first, which
matters.

## Working rules for this task
Your session loads `~/.claude-personal/CLAUDE.md` and `~/.claude/CLAUDE.md`; those files win if they differ from this summary. The
download rules as of this handoff:

> **Downloads: hard rule, every session and subagent.** Download and install nothing (shell, Python, MCP, subagent) outside
> **Allowed**. `~/.claude-personal/framework/hooks/dataset_guard.py` is a second wall, not a licence: if it blocks an allowed call,
> tell the user; never work around it. Unsure: ask.
>
> **Never, even when allowed:**
> - Anything a platform flags as unsafe, malicious, removed or quarantined, or whose status cannot be read (fail closed).
> - Code corpora as data (The Stack, GitHub archives), or repos cloned to be read as data.
> - Code-bearing formats (pickle, `.pt`/`.bin`/`.pkl`/`.joblib`, `trust_remote_code=True`, datasets with a loading script). Use
>   safetensors or ONNX for weights, Parquet or JSONL for data.
> - Leaked or sensitive-by-nature data.
> - "Looking at" a repo means its metadata: a sample or a shard header is a download.
> - A suspect file on disk is never opened, parsed or run: delete it and tell the user.
>
> **Allowed:**
> - Docs and search: WebSearch, documentation pages and GitHub issues as text. No file downloads from them.
> - Own GitHub (`github.com/Adam-Yung/*`): `gh` read commands and normal git on repos already checked out. Other people's repos:
>   metadata only.
> - Own sites (`adam-yung.github.io`): GET/HEAD, and loading pages in the project's browser tooling for measurement. Save only
>   reports.
> - YouTube: `yt-dlp` for media only, throttled, one call at a time. Stop at the first 429, bot check or sign-in demand.
> - Packages: `npm ci` / `pip install -r` from a committed lockfile. A new dependency goes in `scripts/owner/install-deps.sh`
>   (named, exact version, install scripts off, dry run unless `--run`). Run it yourself only for one package at least 30 days old,
>   then report it and run `npm audit`. Otherwise tell the user why it is needed and carry on without it.
> - CI artifacts from own repos: each goes in a new empty directory with its sha256 recorded. Nothing inside is opened or run unless
>   the user says so.
>
> A subagent prompt that may touch the network restates this section in full; subagents do not inherit it.

**Practical notes:**
- In the previous session, plain `curl` to `adam-yung.github.io` was denied even though the rules allow it. Use
  `scripts/perf/load.mjs`, which loads the site through playwright-core and records headers. If you need `curl`, ask the owner to
  allow it rather than working around the denial.
- No task here needs a new dependency.
- The commit gate: run `~/.claude-personal/framework/bin/gate` before every commit and check that it prints `gate: PASS`. In that
  session a commit went through after a FAIL, so do not rely on the hook alone.
