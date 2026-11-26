# src/storage/applyConfig.js

A side-effect module so the user's saved macros and engines replace the bundled ones before any other module is evaluated. A call in
the body of `main.jsx` ran too late: `src/settings/schema.js` builds the search-engine list while it is imported, so engines added in
the macros editor could never be picked in Settings. It must stay the first import of `src/main.jsx`.
