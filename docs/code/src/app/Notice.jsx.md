# src/app/Notice.jsx

The one transient status line. Each notice carries an id and clears only itself, so "Copied" followed quickly by another notice is never cut short by the first one's timer. Notices survive a reset on purpose: "opened in a new tab" style messages must outlive the state they report on.
