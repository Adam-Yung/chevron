# Chevron [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE.md) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

<p align="center">
  <img width="80%" src="https://i.imgur.com/Wa7HcuW.png">
</p>

<p align="center">
  A <strong>minimalist, animated browser startpage</strong> that doubles as a productivity launcher.<br/>
  Smart search, instant converters, AI completion, macros, weather — all offline-capable.
</p>

<p align="center">
  <a href="https://kholmogorov27.github.io/chevron/">Live Demo</a> &nbsp;·&nbsp;
  <a href="https://github.com/kholmogorov27/chevron/releases/latest">Download</a> &nbsp;·&nbsp;
  <a href="#installation">Install</a> &nbsp;·&nbsp;
  <a href="#usage">Usage</a>
</p>

---

## Features

- **Smart search** with Google autosuggestions and personal history
- **Macros** — bookmark-like shortcuts with custom triggers (e.g. `gh` → GitHub)
- **Commands** — extend macros with URL templates (e.g. `so?how to parse html`)
- **Instant converters** — type `100 EUR to USD`, `100kg in lb`, `2h in min` — result appears immediately, Enter copies it to clipboard
- **Calculator** — type `2 * (3 + 4)` or `sqrt(9)` — result appears inline, Enter copies it
- **AI completion** — double-press Space to stream an answer from any OpenAI-compatible endpoint (OpenAI, Ollama, LM Studio, vLLM…)
- **Weather widget** — live conditions + 5-day forecast via OpenWeatherMap
- **Macro menu** — pinned shortcuts in a glassmorphic card carousel; press Shift or right-click to open, then type to filter
- **Keyboard cheatsheet** — press `?` to see every hotkey
- **Theme presets** — 6 built-in themes (midnight, forest, burgundy, slate, dune, noir) + full custom color picker
- **Offline-safe** — the full UI loads from a single HTML file with no CDN dependencies; only live features (currency, AI, weather) need the network
- **In-app editor** — edit macros, commands, and search engines directly from Settings; export/import JSON

---

## Installation

Chevron can be set as your browser homepage or new-tab page.

> **Focus tip**: if you want the page (not the address bar) to receive focus when opening a new tab, use the [New Tab Redirect](https://chrome.google.com/webstore/detail/new-tab-redirect/icpgjfneehieebagbmdbhnlpiopdcmna) extension with the Hosted or GitHub Pages methods on Chromium-based browsers.

### Static (recommended)

The static build is a single self-contained `index.html`. It loads instantly, works offline, and has no server dependency.

1. [Download the latest release](https://github.com/kholmogorov27/chevron/releases/latest)
2. Unzip anywhere you like
3. Point your browser's homepage / new-tab URL at the `dist/index.html` file  
   (e.g. `file:///Users/you/chevron/dist/index.html`)

### Hosted (local server)

Serves the app over `http://localhost` — fixes the address-bar focus issue on Chromium.

1. Clone the repo and [build](#build)
2. Serve `dist/` with any static file server:

   ```bash
   npx http-server dist -p 8000
   # or
   python3 -m http.server 8000 --directory dist
   ```

3. Set `http://localhost:8000` as your new-tab URL

### GitHub Pages

> Depends on GitHub servers and your internet connection — not recommended as a daily driver.

1. Fork the repository
2. Go to **Settings → Pages → Branch: `gh-pages` → Save**
3. Your personal instance will be live at `https://<you>.github.io/chevron/`

---

## Build

> Requires [Node.js](https://nodejs.org/) 18+.

```bash
npm install          # install dependencies (once)
npm run build        # static single-file build → dist/
npm run dev          # dev server with hot reload at http://localhost:5173
npm run preview      # preview the production build at http://localhost:4173
```

Two build profiles are available:

| Command | Output | Use case |
|---|---|---|
| `npm run build` / `build:static` | Single inlined `dist/index.html` | Static file, release zip |
| `npm run build:hosted` | Multi-chunk build with hashed filenames | Hosted server, GitHub Pages |

---

## Usage

### Basic search

Just start typing — the input always has focus. Suggestions appear from your history and Google autocomplete. Press **Enter** to search, **Esc** to clear.

Use **Tab / Shift+Tab** or **↑ / ↓** to navigate suggestions.

Hold **Ctrl** while pressing Enter to bypass macros and force a raw search engine query.

### Instant answers

Type a calculation or conversion and the result appears at the top of the suggestions list. Press **Enter** (or click the result) to copy it to your clipboard — a "Copied!" toast confirms the action.

| Query | Example | Result |
|---|---|---|
| Calculator | `2 * (3 + 4)` | `14` |
| Currency | `100 EUR to USD` | `117.51 USD` |
| Weight | `100 kg in lb` | `220.462 lb` |
| Time | `2h in min` | `120 min` |

Calculator supports `+`, `-`, `*`, `/`, `^`, parentheses, unary minus, and implicit multiplication (e.g. `2(3+1)`).

### Macros and commands

A **macro** is a smart bookmark. Its triggers let you navigate to a URL by typing a short keyword and pressing Enter — or by selecting it from suggestions.

When you type a trigger exactly (e.g. `gh`) the matching macro floats to the top of the suggestions list with a bookmark icon and shows its name. The left widget updates to the macro's color as soon as it's selected. Press **Enter** or click it to navigate directly.

Typing a prefix (e.g. `gi`) surfaces all macros whose triggers start with those letters, so you can discover what shortcuts exist without memorising them. Your query is still a normal search until you actively select a macro suggestion — nothing gets hijacked.

```
> gh          →  select the GitHub suggestion → opens github.com
> gi          →  shows GitHub, GitLab, etc. as suggestions
```

A **command** adds URL-template logic to a macro. Everything after the command trigger becomes the argument `{$}`:

```
> so?how to parse html with regex   →  opens a Stack Overflow search
```

Hold **Ctrl** while submitting to ignore macros and use the search engine instead.

### Macro menu

Pinned macros live in a card carousel. Open it with:

- **Shift** (tap to toggle, hold to peek)
- **Right-click** anywhere on the page
- The toggle button in the bottom-right corner

While the menu is open, **type to filter** the visible cards. Use **← →** or the mouse wheel to scroll; swipe on touch screens.

Press a macro's hotkey (`Shift` + `<key>`) to jump directly to it from anywhere.

### AI completion

1. Type your question
2. Double-press **Space** to stream an AI answer inline above the input

Configure the provider in **Settings → Query → AI**:

| Field | OpenAI | Ollama (local) |
|---|---|---|
| Provider | `OpenAI` | `Ollama (local)` |
| Base URL | _(leave blank)_ | `http://localhost:11434` |
| Model | blank → `gpt-3.5-turbo`, or e.g. `gpt-4o-mini` | required, e.g. `llama3`, `mistral` |
| API key | required | leave blank |

> **Local-LLM safety**: when set to Ollama, Chevron will not make any request unless both Base URL and Model are filled in — preventing accidental probes of localhost on machines without Ollama.

### Weather widget

Set up in **Settings → Weather**: enter your city or allow geolocation. Today's conditions appear in the top bar; hover (or tap) to reveal a 5-day forecast strip.

### Keyboard cheatsheet

Press `?` (Shift+/) at any time to open the full hotkey reference.

| Key | Action |
|---|---|
| `Enter` | Search / copy instant answer |
| `Esc` | Clear query (double-tap: also blur input) |
| `Tab` / `Shift+Tab` | Cycle through suggestions |
| `↑` / `↓` | Navigate suggestions |
| `Shift` | Toggle macro menu |
| `Space Space` | Trigger AI completion |
| `?` | Open keyboard cheatsheet |
| `Shift` + `<key>` | Activate a pinned macro's hotkey |
| `Ctrl` + `Enter` | Force search engine (skip macros) |
| `RMB` | Open macro menu |

---

## Configuration

### Settings panel

Click the gear icon (top-right, appears on hover after your first visit) to open Settings. From here you can configure:

- **General**: search engine, language/locale, search history on/off
- **Appearance**: theme preset or custom colors, UI style, animations
- **Query**: font sizes, suggestion limits, AI provider, caret visibility
- **Weather**: API key, location, units

### In-app macros/commands/engines editor

Open **Settings → Edit macros** to launch the full editor. Four tabs:

- **Macros** — add/remove/reorder bookmarks; set name, URL, triggers, colors, icon, hotkey, per-macro commands
- **Commands** — define global command types and their triggers
- **Engines** — customize search engine names, colors, and URL templates
- **Raw JSON** — power-user view; edits sync back to the form tabs

**Export** downloads your config as `chevron-config.json`. **Import** loads any compatible JSON file. **Reset** restores the bundled defaults.

> All config is saved to `localStorage` — no account or server required.

---

## For contributors

- [Roadmap.md](./Roadmap.md) — phased improvement plan, shipped phases, and ideas backlog
- [Maintainer.md](./Maintainer.md) — architecture notes, release process, and dev conventions

---

<p align="center">
  inspired by <a href="https://github.com/xvvvyz/tilde">Tilde</a>
</p>
