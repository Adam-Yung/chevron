# Settings

> Verified: 2026-11-28 00:12 · Sources: `src/features/settings-panel/Settings.jsx`, `src/features/settings-panel/SettingsPane.jsx`, `src/features/settings-panel/SettingsSidebar.jsx`, `src/features/settings-panel/GeocodeRow.jsx`, `src/settings/schema.js`, `src/settings/SettingsProvider.jsx`, `src/settings/resolveSettings.js`, `src/settings/settingsMigration.js`, `src/storage/settingsStorage.js`, `src/storage/macrosConfig.js`
> Serves: `own-your-setup`
> Owns: `src/settings/**`, `src/features/settings-panel/**`, `src/storage/localStorageObject.js`, `src/storage/settingsStorage.js`, `src/storage/obfuscate.js`, `src/app/useDocumentTheme.js`, `src/lib/camelCaseToTitle.js`, `src/lib/color.js`, `src/lib/getContrast.js`, `src/lib/propertyByPath.js`

## Using the panel

Open it with the gear button at the top right (`Open settings`). Close it with the X, with Esc, or by clicking outside it; the search
field gets the keyboard back each time. Every change applies at once and is saved automatically (a moment after you stop editing, and
immediately when the page is hidden or closed). There is nothing to confirm or cancel.

The sidebar lists the categories. "Show advanced" reveals fields that are hidden by default (derived theme colours, chevron
curvature, weather coordinates). "Reset settings" and "Clean history" ask first, clear the stored data and reload.

## Categories

| Category | Holds |
| --- | --- |
| General | Default search engine, search history on/off, open results in a new tab, animation speed (ms; 0 turns animation off; default 250), locale, tab title |
| Appearance | Colour scheme (auto, light, dark), active theme and its colours, show the pinned-sites dock, blur behind suggestions, arrows and weather, swipe and trackpad gestures |
| Chevron | Stroke thickness and size of the chevron, quick-look marquee and macro labels |
| Query | Search field and suggestion font sizes and limits, caret, Ctrl-forces-search-engine, and the AI block (provider, endpoint, model, key, temperature, language) |
| Menu | Macro grid rows, columns, gap, pagination dots, arrows, dragging, and the clock (size and format) |
| Weather | OpenWeatherMap key, city (with a Resolve lookup that fills latitude and longitude), units, forecast days |
| Macros | The macros, commands and search-engine editor |

Theme colours: each theme has a light and a dark set; the switch beside a theme chooses which set you are editing. Only primary,
secondary and accent are edited, the other colours follow them. A colour change applies when you press the check button, and
shows a contrast rating. Built-in presets: default, midnight, forest, burgundy, slate, dune, noir. Every preset is sewn the same
way (canvas, stitching, badges); `default` is the Sleeve Patch colours, navy and gold when dark, khaki and brick when light.

Number fields take any value in range while typing; an empty or out-of-range entry is not applied and the field returns to the saved
value when you leave it.

## What is saved

Settings live in `localStorage` under `settings`; macros, commands and engines under `chevron.config`. Only values that differ
from the defaults are written, so a default improved in a later version reaches you unless you changed that setting. API keys (AI,
weather) are lightly obfuscated at rest, which is not encryption.

Damaged data never stops the page loading. Invalid JSON is copied to `chevron.corrupt.settings.<time>`; values of the wrong type are
dropped (the default is used) and the original is kept under `chevron.settings.bak.<time>`. Missing or broken themes are repaired.
When a release changes how a setting is stored, a version stamp (`chevron.settings.version`) triggers a one-off migration; version 4
replaces a stored animation speed of exactly 400 ms (the old default) with the new default of 250 ms.

## Import and export

The macros editor (Macros tab) imports and exports the macros, commands and engines JSON; URLs using `javascript:`, `data:`,
`vbscript:` or `file:` are rejected. After a save or reset the app announces `chevron:config` on `window` so parts that copied the
config at start (the sites menu, macro suggestions) refresh. The other settings have no file export; copy the `settings` value from
the browser's storage to move them.

## Limits

- Reset and Clean history reload the page.
- Settings are per browser profile and per origin; there is no sync.
- "Notify about forced search engine" (Query) is shown in the panel but nothing reads it.
