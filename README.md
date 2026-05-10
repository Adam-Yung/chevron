# Chevron

<p align="center">
  <img width="80%" src="https://i.imgur.com/Wa7HcuW.png">
</p>

<p align="center">
  <strong>Your browser's blank tab is wasted space. Chevron turns it into a command center.</strong><br/>
  Search, calculate, convert currencies, launch bookmarks, ask AI — all from a single animated interface that works offline.
</p>

<p align="center">
  <a href="https://adam-yung.github.io/chevron/">Try the Live Demo</a> &nbsp;·&nbsp;
  <a href="https://github.com/Adam-Yung/chevron/releases/latest">Download</a> &nbsp;·&nbsp;
  <a href="#get-started">Get Started</a>
</p>

---

## Why Chevron?

Every time you open a new tab, you get a blank page or a cluttered browser default. Chevron replaces that dead space with a fast, beautiful launcher that keeps your hands on the keyboard and your focus on what matters.

- **Instant** — loads from a single HTML file, no server required, works offline
- **Private** — all data stays in your browser's local storage, no accounts, no telemetry
- **Portable** — runs anywhere: desktop browsers, Android tablets via Termux, Raspberry Pi kiosks, self-hosted servers
- **Customizable** — 6 theme presets, full color control, editable macros, configurable search engines

---

## What You Can Do

### Search smarter
Start typing and Chevron shows suggestions from Google autocomplete and your personal history. Press Enter to search. That's it — no clicking, no menus.

### Launch anything with macros
Set up short triggers for your most-visited sites. Type `gh` and press Enter to go straight to GitHub. Type `so?how to center a div` to search Stack Overflow directly. Macros are fully customizable with colors, icons, and keyboard shortcuts.

### Get instant answers
No need to open a calculator app or Google a conversion:

| You type | You get |
|---|---|
| `2 * (3 + 4)` | `14` — copied to clipboard on Enter |
| `100 EUR to USD` | Live exchange rate, no API key needed |
| `5kg in lb` | `11.023 lb` |
| `90min in hours` | `1.5 hours` |

### Ask AI inline
Double-tap Space to stream an answer from ChatGPT, Ollama, LM Studio, or any OpenAI-compatible endpoint. The response appears right above the search bar — no context switching.

### See the weather at a glance
A minimal weather chip shows current conditions. Hover for a 5-day forecast. Powered by OpenWeatherMap (free tier).

### Browse your macros visually
Press Shift or right-click to open a glassmorphic card carousel of your pinned sites. Type to filter. Use keyboard shortcuts to jump directly.

### Stay in control
Press `?` to see every keyboard shortcut. Open Settings to configure everything from search engines to animation behavior. Export your config as JSON and carry it between machines.

---

## Get Started

Chevron works anywhere a modern browser runs. Choose the setup that fits your workflow:

### Option 1: Local file (simplest)

Open the HTML file directly in your browser. Zero dependencies, works offline, nothing to install.

1. [Download the latest release](https://github.com/Adam-Yung/chevron/releases/latest)
2. Unzip anywhere
3. Set your browser's homepage or new-tab URL to the file:
   ```
   file:///path/to/chevron/dist/index.html
   ```

**Best for:** Single machine, maximum privacy, offline-first use.

### Option 2: Local HTTP server (recommended for daily use)

Serving over localhost fixes the Chromium address-bar focus issue — when you open a new tab, the cursor lands in Chevron's search field instead of the browser's URL bar.

**Using Python (already on most systems):**
```bash
cd /path/to/chevron/dist
python3 -m http.server 8080
```

**Using Node.js:**
```bash
npx http-server /path/to/chevron/dist -p 8080
```

Then set `http://localhost:8080` as your new-tab page.

> **Tip for Chromium users:** Install the [New Tab Redirect](https://chrome.google.com/webstore/detail/new-tab-redirect/icpgjfneehieebagbmdbhnlpiopdcmna) extension and point it at `http://localhost:8080` for proper focus behavior on every new tab.

**Best for:** Daily driver on desktop. Fast, local, and the cursor always lands in the right place.

### Option 3: Android tablet or phone (Termux)

Run Chevron as your mobile browser's startpage without any cloud service:

1. Install [Termux](https://f-droid.org/packages/com.termux/) from F-Droid
2. Inside Termux:
   ```bash
   pkg install python
   cd ~/storage/shared/Download   # or wherever you unzipped Chevron
   python3 -m http.server 8080
   ```
3. Open Chrome → Settings → Homepage → `http://localhost:8080`
4. (Optional) Add `python3 -m http.server 8080 --directory /path/to/dist &` to your `~/.bashrc` so it starts automatically

**Best for:** Android tablets as dedicated dashboards, kiosk-style setups, or replacing your phone's default new-tab page.

### Option 4: Self-hosted on your network

Serve Chevron from a Raspberry Pi, NAS, or home server so every device on your network can use it:

```bash
# On your server
git clone https://github.com/Adam-Yung/chevron.git
cd chevron
npm install && npm run build
python3 -m http.server 8080 --directory dist --bind 0.0.0.0
```

Then point any browser on your network to `http://<server-ip>:8080`.

**Best for:** Households or teams who want a shared startpage. Each browser still gets its own config via localStorage.

### Option 5: GitHub Pages (cloud-hosted)

Host your own instance for free on GitHub — accessible from anywhere with an internet connection.

1. Fork the repository
2. Go to **Settings → Pages → Branch: `gh-pages` → Save**
3. Your instance goes live at `https://<you>.github.io/chevron/`

**Best for:** Access from multiple machines without running a server. Depends on your internet connection, so not ideal as a primary daily driver.

---

## Deployment Comparison

| Method | Offline? | Auto-focus? | Multi-device? | Setup effort |
|---|---|---|---|---|
| Local file | Yes | No* | No | 1 minute |
| Local HTTP server | Yes | Yes | No | 2 minutes |
| Termux (Android) | Yes | Yes | No | 5 minutes |
| Self-hosted LAN | Yes | Yes | Yes | 10 minutes |
| GitHub Pages | No | Yes | Yes | 3 minutes |

*Chromium doesn't focus page content for `file://` URLs by default.

---

## Configuration

### Settings panel
Click the gear icon (top-right) to configure:
- **General** — search engine, language, history on/off
- **Appearance** — theme presets (midnight, forest, burgundy, slate, dune, noir) or full custom colors
- **Query** — font sizes, suggestion limits, AI provider setup
- **Weather** — API key, location, units

### Macros editor
Open **Settings → Edit macros** to add, remove, or reorder your bookmarks. Four tabs:
- **Macros** — name, URL, triggers, colors, icon, hotkey
- **Commands** — URL templates with arguments (e.g. `so?{query}`)
- **Engines** — customize search engine names, colors, and URL patterns
- **Raw JSON** — power-user view for bulk edits

Export your config to carry it between machines. Import any compatible JSON file to restore.

### AI setup

| Provider | Base URL | Model | API key |
|---|---|---|---|
| OpenAI | _(leave blank)_ | `gpt-4o-mini`, `gpt-3.5-turbo`, etc. | Required |
| Ollama (local) | `http://localhost:11434` | `llama3`, `mistral`, etc. | Not needed |
| LM Studio | `http://localhost:1234` | _(auto-detected)_ | Not needed |
| Any OpenAI-compatible | Your endpoint URL | Your model name | If required |

Chevron never probes localhost unless you explicitly configure a local provider with both a URL and model name.

---

## Keyboard Reference

| Key | Action |
|---|---|
| Just start typing | Search — the input always has focus |
| `Enter` | Search or copy instant answer |
| `Esc` | Clear query (double-tap: full reset) |
| `Tab` / `Shift+Tab` | Cycle suggestions |
| `↑` / `↓` | Navigate suggestions |
| `Shift` | Toggle macro menu |
| `Space Space` | Ask AI |
| `?` | Show all keyboard shortcuts |
| `Ctrl+Enter` | Force search engine (skip macros) |

---

## Building from Source

Requires [Node.js](https://nodejs.org/) 18+.

```bash
npm install          # install dependencies
npm run build        # single-file build → dist/index.html
npm run dev          # dev server with hot reload
```

Two build profiles:

| Command | Output | Use case |
|---|---|---|
| `npm run build` | Single `index.html` (~1 MB, everything inlined) | Local file, release zip, Termux |
| `npm run build:hosted` | Multi-file with cache-friendly hashes | HTTP servers, GitHub Pages |

---

## License

MIT — use it however you want. See [LICENSE.md](./LICENSE.md).

---

## Contributing

- [Roadmap.md](./Roadmap.md) — what's planned, what's shipped, and what's up for grabs
- [Maintainer.md](./Maintainer.md) — architecture overview and development conventions

---

<p align="center">
  Originally created by <a href="https://github.com/kholmogorov27">Ivan Kholmogorov</a>, inspired by <a href="https://github.com/xvvvyz/tilde">Tilde</a>
</p>
