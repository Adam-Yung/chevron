# App shell and state

> Verified: 2026-11-28 00:12 · Sources: `index.html`, `src/main.jsx`, `src/app/App.jsx`, `src/app/bootShell.js`, `src/state/ui.js`, `src/state/store.js`, `src/app/Notice.jsx`, `src/app/ErrorBoundary.jsx`
> Serves: `fast-launch`, `never-stuck`
> Owns: `index.html`, `src/main.jsx`, `src/state/**`, `src/app/App.jsx`, `src/app/ErrorBoundary.jsx`, `src/app/bootShell.js`, `src/app/Notice.*`, `src/app/useMediaQuery.js`, `src/app/whenTabVisible.js`, `src/lib/getClasses.js`, `src/lib/isMobile.js`

What boots the page and holds it together: the first-paint shell, the React root, the one UI state and the layout.

## What it does
- Before the bundle runs, the page shows the idle chevron in the saved colours and keeps what you type.
- One status line reports short events such as "Copied".
- A render crash shows a message with a Reload button.

## How it works
`src/main.jsx` applies the saved config, then mounts the providers and `App`. `App` installs the input and navigation handlers and
lays out the features. All UI state is one reducer (`src/state/ui.js`).

## Rules that must hold
- Every state can be left; the reducer enforces its invariants after every action.
- Settings and the cheatsheet load only when opened.
- `config.js` and `icons.js` run before the app.

## How to check it
`src/state/ui.test.js`, `src/app/bootShell.test.js`, the `stuck-states` and `hosted-boot` end-to-end specs.
