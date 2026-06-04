#!/usr/bin/env node
import https from 'https'
import http from 'http'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'

const ICONS_PATH = resolve(import.meta.dirname, '..', 'public', 'icons.js')
const TIMEOUT_MS = 10000

// ── HTTP helper ──────────────────────────────────────────────────────
// Uses the https module with a relaxed TLS agent so it works behind
// corporate proxies / Zscaler that inject self-signed certificates.

const tlsAgent = new https.Agent({ rejectUnauthorized: false })

function fetchBuffer(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (redirects <= 0) return reject(new Error('Too many redirects'))
    const isHttps = url.startsWith('https')
    const client = isHttps ? https : http
    const opts = isHttps ? { agent: tlsAgent } : {}
    const req = client.get(url, opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location
        if (loc.startsWith('/')) loc = new URL(loc, url).href
        res.resume()
        return fetchBuffer(loc, redirects - 1).then(resolve, reject)
      }
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy()
      reject(new Error(`Timed out after ${TIMEOUT_MS / 1000}s: ${url}`))
    })
  })
}

function fetchText(url) {
  return fetchBuffer(url).then(b => b.toString('utf-8'))
}

// ── Arg helpers ──────────────────────────────────────────────────────

/** Returns true if the arg looks like a domain or URL (contains a dot or ://) */
function looksLikeDomain(arg) {
  if (arg.includes('://')) return true
  // must contain a dot and the TLD part must be letters only (no spaces)
  return /^[^\s]+\.[a-zA-Z]{2,}$/.test(arg)
}

function domainFromArg(arg) {
  if (arg.includes('://')) return new URL(arg).hostname
  return arg.replace(/^www\./, '')
}

function nameFromDomain(domain) {
  return domain.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]/g, '')
}

function nameFromQuery(query) {
  return query.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
}

// ── SVG sanitisation ─────────────────────────────────────────────────

/** Strip XML preamble, comments, and normalise to single-quoted, one-line SVG. */
function sanitiseSvg(raw) {
  let svg = raw.trim()
  svg = svg.replace(/<\?xml[^?]*\?>\s*/g, '')
  svg = svg.replace(/<!--[\s\S]*?-->/g, '')
  svg = svg.replace(/<title>[^<]*<\/title>/g, '')
  svg = svg.replace(/\s+/g, ' ').trim()
  if (!/<svg[^>]*\bfill\s*=/.test(svg)) {
    svg = svg.replace('<svg ', '<svg fill="currentColor" ')
  }
  return svg
}

// ── Brand colour lookup ──────────────────────────────────────────────

let _simpleIconsData = null

async function getSimpleIconsData() {
  if (_simpleIconsData) return _simpleIconsData
  const url = 'https://raw.githubusercontent.com/simple-icons/simple-icons/develop/data/simple-icons.json'
  const text = await fetchText(url)
  _simpleIconsData = Object.values(JSON.parse(text))
  return _simpleIconsData
}

function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/\+/g, 'plus')
    .replace(/\./g, 'dot')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '')
}

async function lookupBrandColor(domain) {
  try {
    const slug = nameFromDomain(domain).toLowerCase()
    const icons = await getSimpleIconsData()
    const match = icons.find(i => titleToSlug(i.title) === slug)
    if (match?.hex) return '#' + match.hex
  } catch {
    // non-fatal
  }
  return null
}

/** Extract hex colours from SVG fill/stroke attributes. */
function extractSvgColors(svg) {
  const hexes = new Set()
  const re = /(?:fill|stroke)\s*[:=]\s*["']?\s*(#[0-9a-fA-F]{3,8})\b/g
  let m
  while ((m = re.exec(svg))) {
    const c = m[1].toLowerCase()
    if (c !== '#000' && c !== '#000000' && c !== '#fff' && c !== '#ffffff') {
      hexes.add(c.length === 4 ? '#' + c[1]+c[1]+c[2]+c[2]+c[3]+c[3] : c)
    }
  }
  return [...hexes]
}

// ── Domain icon sources ───────────────────────────────────────────────

/**
 * Simple Icons (simpleicons.org) — brand SVGs for thousands of tech brands.
 * Fetches from raw GitHub to avoid Cloudflare bot-blocking on the CDN.
 */
async function trySimpleIcons(domain) {
  const slug = nameFromDomain(domain).toLowerCase()
  const url = `https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/${slug}.svg`
  const text = await fetchText(url)
  if (!text.includes('<svg')) throw new Error('Not an SVG response')
  return sanitiseSvg(text)
}

/** Site's own /favicon.svg — some modern sites serve vector favicons. */
async function trySiteFaviconSvg(domain) {
  const url = `https://${domain}/favicon.svg`
  const text = await fetchText(url)
  if (!text.includes('<svg')) throw new Error('Not an SVG response')
  return sanitiseSvg(text)
}

/** Google favicon service — always PNG, embedded as base64 <image> inside SVG. */
async function tryGoogleFavicon(domain) {
  const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  const buf = await fetchBuffer(url)
  const b64 = buf.toString('base64')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><image href="data:image/png;base64,${b64}" width="128" height="128"/></svg>`
}

const DOMAIN_SOURCES = [
  { name: 'Simple Icons', fn: trySimpleIcons },
  { name: 'site favicon.svg', fn: trySiteFaviconSvg },
  { name: 'Google favicon (raster)', fn: tryGoogleFavicon },
]

// ── General search sources ────────────────────────────────────────────

/**
 * Iconify API — structured REST search across 200k+ icons (Material, Phosphor,
 * Tabler, Heroicons, Feather, game-icons, and many more). No auth required.
 *
 * Uses the JSON data API (/{prefix}.json?icons={name}) rather than the SVG
 * CDN endpoint, which returns intermittent 500s.
 */
async function tryIconify(query) {
  const searchUrl = `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=1`
  const searchData = JSON.parse(await fetchText(searchUrl))
  if (!searchData.icons?.length) throw new Error('No Iconify result')

  const iconRef = searchData.icons[0]  // e.g. "tabler:pacman"
  const [prefix, iconName] = iconRef.split(':')

  const dataUrl = `https://api.iconify.design/${prefix}.json?icons=${iconName}`
  const iconData = JSON.parse(await fetchText(dataUrl))
  const icon = iconData.icons?.[iconName]
  if (!icon?.body) throw new Error('No icon body in data')

  const w = iconData.width || 24
  const h = iconData.height || 24
  return sanitiseSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${icon.body}</svg>`)
}

/**
 * Game Icons (game-icons.net) via GitHub raw — 4000+ icons covering games,
 * fantasy, sci-fi, food, animals, and general symbols. Great for queries like
 * "pacman", "chess", "potion", "skull", "rocket", etc.
 */
let _gameIconsIndex = null
async function getGameIconsIndex() {
  if (_gameIconsIndex) return _gameIconsIndex
  const url = 'https://raw.githubusercontent.com/game-icons/icons/master/index.json'
  const data = JSON.parse(await fetchText(url))
  _gameIconsIndex = (Array.isArray(data) ? data : []).map(e => (typeof e === 'string' ? e : e.name ?? '')).filter(Boolean)
  return _gameIconsIndex
}

async function tryGameIcons(query) {
  const index = await getGameIconsIndex()
  const q = query.toLowerCase().replace(/\s+/g, '-')
  const match = index.find(n => n === q)
    || index.find(n => n.startsWith(q))
    || index.find(n => n.includes(q))
  if (!match) throw new Error('No Game Icons match')
  const url = `https://raw.githubusercontent.com/game-icons/icons/master/svg/ffffff/transparent/${match}.svg`
  const text = await fetchText(url)
  if (!text.includes('<svg')) throw new Error('Not an SVG response')
  return sanitiseSvg(text)
}

/**
 * Simple Icons fuzzy fallback — searches the brand dataset by title for cases
 * where a query term loosely matches a brand (e.g. "apple", "spotify").
 */
async function trySimpleIconsFuzzy(query) {
  const icons = await getSimpleIconsData()
  const q = query.toLowerCase().replace(/\s+/g, '')
  const match = icons.find(i => titleToSlug(i.title).includes(q) || q.includes(titleToSlug(i.title)))
  if (!match) throw new Error('No Simple Icons fuzzy match')
  const slug = titleToSlug(match.title)
  const url = `https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/${slug}.svg`
  const text = await fetchText(url)
  if (!text.includes('<svg')) throw new Error('Not an SVG response')
  return sanitiseSvg(text)
}

const SEARCH_SOURCES = [
  { name: 'Iconify', fn: tryIconify },
  { name: 'Game Icons', fn: tryGameIcons },
  { name: 'Simple Icons (fuzzy)', fn: trySimpleIconsFuzzy },
]

// ── Entry generation ─────────────────────────────────────────────────

async function generateEntryFromDomain(domain, name) {
  for (const source of DOMAIN_SOURCES) {
    try {
      const svg = await source.fn(domain)
      return { name, svg, source: source.name, domain, isSearch: false }
    } catch {
      // try next source
    }
  }
  throw new Error('All icon sources failed')
}

async function generateEntryFromSearch(query, name) {
  for (const source of SEARCH_SOURCES) {
    try {
      const svg = await source.fn(query)
      return { name, svg, source: source.name, query, isSearch: true }
    } catch {
      // try next source
    }
  }
  throw new Error('All search sources failed')
}

// ── Colour suggestion ────────────────────────────────────────────────

async function suggestColors(entry) {
  if (!entry.isSearch) {
    const brand = await lookupBrandColor(entry.domain)
    if (brand) return { colors: [brand], via: 'Simple Icons brand color' }
  }
  const svgColors = extractSvgColors(entry.svg)
  if (svgColors.length > 0) return { colors: svgColors, via: 'extracted from SVG' }
  return null
}

function formatColorSuggestion(suggestion) {
  if (!suggestion) return '  (no color suggestion available)'
  const { colors, via } = suggestion
  if (colors.length === 1) {
    return `  Suggested bgColor (${via}):  { type: 'solid', color: '${colors[0]}' }`
  }
  const arr = colors.map(c => `'${c}'`).join(', ')
  return `  Suggested bgColor (${via}):  { type: 'gradient', gradientType: 'linear', angle: 45, colors: [${arr}] }`
}

// ── File insertion ───────────────────────────────────────────────────

function insertIntoFile(entries) {
  let content = readFileSync(ICONS_PATH, 'utf-8')
  const closingBrace = content.lastIndexOf('}')
  if (closingBrace === -1) {
    console.error('Could not find closing } in', ICONS_PATH)
    process.exit(1)
  }

  const existing = entries.filter(e => content.includes(`  ${e.name}:`))
  if (existing.length > 0) {
    console.error(`Skipping already-existing icon(s): ${existing.map(e => e.name).join(', ')}`)
    entries = entries.filter(e => !content.includes(`  ${e.name}:`))
    if (entries.length === 0) return
  }

  const before = content.slice(0, closingBrace).trimEnd()
  const after = content.slice(closingBrace)
  const needsComma = before.trimEnd().endsWith("'") || before.trimEnd().endsWith('"') || before.trimEnd().endsWith(',')

  const lines = entries.map(({ name, svg }) => `  ${name}: '${svg.replace(/'/g, "\\'")}'`)
  const insertion = (needsComma ? ',\n' : '\n') + lines.join(',\n') + '\n'

  content = before + insertion + after
  writeFileSync(ICONS_PATH, content, 'utf-8')
}

// ── CLI ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2)

const noBuild = args.includes('--no-build')
let customName = null
const nameIdx = args.indexOf('--name')
if (nameIdx !== -1) customName = args[nameIdx + 1]

const positional = args.filter((a, i) => {
  if (a.startsWith('--')) return false
  if (i > 0 && args[i - 1] === '--name') return false
  return true
})

if (positional.length === 0) {
  console.log(`Usage: npm run icons -- <domain|query> [domain|query ...] [--name customName] [--no-build]

Fetches a vector SVG icon and adds it to public/icons.js.

If the argument looks like a domain/URL, it searches brand icon sources:
  Simple Icons → site /favicon.svg → Google favicon (raster fallback)

If it doesn't look like a domain, it searches general SVG libraries:
  Iconify → SVGRepo → Simple Icons (fuzzy)

Examples:
  npm run icons -- github.com
  npm run icons -- reddit.com twitch.tv
  npm run icons -- https://news.ycombinator.com --name hackernews
  npm run icons -- pacman
  npm run icons -- "stock market" --name stocks
  npm run icons -- "chess knight" --name chess

Options:
  --name <name>   Custom key name in icons.js (only for single argument)
  --no-build      Skip the rebuild step after writing`)
  process.exit(0)
}

if (customName && positional.length > 1) {
  console.error('--name can only be used with a single argument')
  process.exit(1)
}

const entries = []
for (const arg of positional) {
  const isDomain = looksLikeDomain(arg)
  const name = customName || (isDomain ? nameFromDomain(domainFromArg(arg)) : nameFromQuery(arg))
  const label = isDomain ? domainFromArg(arg) : `"${arg}"`
  const mode = isDomain ? 'domain' : 'search'
  process.stderr.write(`Fetching icon for ${label} (${mode})...`)
  try {
    const entry = isDomain
      ? await generateEntryFromDomain(domainFromArg(arg), name)
      : await generateEntryFromSearch(arg, name)
    entries.push(entry)
    process.stderr.write(` done (${entry.source})\n`)
  } catch (err) {
    process.stderr.write(` FAILED: ${err.message}\n`)
  }
}

if (entries.length === 0) {
  console.error('No icons fetched successfully.')
  process.exit(1)
}

// Fetch colour suggestions (best-effort, in parallel)
process.stderr.write('Looking up brand colours...')
const colorResults = await Promise.all(entries.map(e => suggestColors(e)))
process.stderr.write(' done\n')

insertIntoFile(entries)
console.log(`Wrote ${entries.length} icon(s) to ${ICONS_PATH}:`)
entries.forEach((e, i) => {
  console.log(`  • ${e.name} (via ${e.source})`)
  console.log(formatColorSuggestion(colorResults[i]))
})

if (!noBuild) {
  console.log('\nRebuilding...')
  try {
    execSync('npm run build', {
      cwd: resolve(import.meta.dirname, '..'),
      stdio: 'inherit',
    })
  } catch {
    console.error('Build failed. You can retry with: npm run build')
    process.exit(1)
  }
}
