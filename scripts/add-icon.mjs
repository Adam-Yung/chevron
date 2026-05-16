#!/usr/bin/env node
import https from 'https'
import http from 'http'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'

const ICONS_PATH = resolve(import.meta.dirname, '..', 'public', 'icons.js')
const TIMEOUT_MS = 8000

// ── HTTP helper ──────────────────────────────────────────────────────

function fetchBuffer(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (redirects <= 0) return reject(new Error('Too many redirects'))
    const client = url.startsWith('https') ? https : http
    const req = client.get(url, (res) => {
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
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy(new Error(`Timed out after ${TIMEOUT_MS / 1000}s: ${url}`))
    })
  })
}

function fetchText(url) {
  return fetchBuffer(url).then(b => b.toString('utf-8'))
}

// ── Arg helpers ──────────────────────────────────────────────────────

function domainFromArg(arg) {
  if (arg.includes('://')) return new URL(arg).hostname
  return arg.replace(/^www\./, '')
}

function nameFromDomain(domain) {
  return domain.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]/g, '')
}

// ── SVG sanitisation ─────────────────────────────────────────────────

/** Strip XML preamble, comments, and normalise to single-quoted, one-line SVG. */
function sanitiseSvg(raw) {
  let svg = raw.trim()
  // strip <?xml ...?>
  svg = svg.replace(/<\?xml[^?]*\?>\s*/g, '')
  // strip <!-- comments -->
  svg = svg.replace(/<!--[\s\S]*?-->/g, '')
  // strip <title>...</title>
  svg = svg.replace(/<title>[^<]*<\/title>/g, '')
  // collapse whitespace
  svg = svg.replace(/\s+/g, ' ').trim()
  // ensure fill="currentColor" on root <svg> if no fill is set
  if (!/<svg[^>]*\bfill\s*=/.test(svg)) {
    svg = svg.replace('<svg ', '<svg fill="currentColor" ')
  }
  return svg
}

// ── Brand colour lookup ──────────────────────────────────────────────

let _simpleIconsData = null

/** Fetch the Simple Icons dataset (cached across calls). */
async function getSimpleIconsData() {
  if (_simpleIconsData) return _simpleIconsData
  const url = 'https://raw.githubusercontent.com/simple-icons/simple-icons/develop/data/simple-icons.json'
  const text = await fetchText(url)
  _simpleIconsData = Object.values(JSON.parse(text))
  return _simpleIconsData
}

/** Simple Icons derives slugs from titles: lowercase, strip non-alnum. */
function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/\+/g, 'plus')
    .replace(/\./g, 'dot')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '')
}

/** Look up a brand colour from Simple Icons by domain-derived slug. */
async function lookupBrandColor(domain) {
  try {
    const slug = nameFromDomain(domain).toLowerCase()
    const icons = await getSimpleIconsData()
    const match = icons.find(i => titleToSlug(i.title) === slug)
    if (match?.hex) return '#' + match.hex
  } catch {
    // non-fatal — colour suggestion is best-effort
  }
  return null
}

/** Extract hex colours from SVG fill/stroke attributes (for non-Simple-Icons sources). */
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

// ── Icon sources (tried in order) ────────────────────────────────────

/**
 * 1. Simple Icons (simpleicons.org) — clean vector SVGs for thousands of
 *    brands.  Uses the slug (lowercase, no spaces/dots).
 *    Fetches from raw GitHub to avoid Cloudflare bot-blocking on the CDN.
 */
async function trySimpleIcons(domain) {
  const slug = nameFromDomain(domain).toLowerCase()
  const url = `https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/${slug}.svg`
  const text = await fetchText(url)
  if (!text.includes('<svg')) throw new Error('Not an SVG response')
  return sanitiseSvg(text)
}

/**
 * 2. Site's own /favicon.svg — some modern sites serve vector favicons.
 */
async function trySiteFaviconSvg(domain) {
  const url = `https://${domain}/favicon.svg`
  const text = await fetchText(url)
  if (!text.includes('<svg')) throw new Error('Not an SVG response')
  return sanitiseSvg(text)
}

/**
 * 3. Google favicon service — always returns a PNG, so we embed it as a
 *    base64 <image> inside an SVG.  This is the fallback of last resort.
 */
async function tryGoogleFavicon(domain) {
  const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  const buf = await fetchBuffer(url)
  const b64 = buf.toString('base64')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><image href="data:image/png;base64,${b64}" width="128" height="128"/></svg>`
}

const SOURCES = [
  { name: 'Simple Icons', fn: trySimpleIcons },
  { name: 'site favicon.svg', fn: trySiteFaviconSvg },
  { name: 'Google favicon (raster)', fn: tryGoogleFavicon },
]

async function generateEntry(domain, name) {
  for (const source of SOURCES) {
    try {
      const svg = await source.fn(domain)
      return { name, svg, source: source.name, domain }
    } catch {
      // try next source
    }
  }
  throw new Error('All icon sources failed')
}

// ── Colour suggestion ────────────────────────────────────────────────

async function suggestColors(entry) {
  // Try Simple Icons brand colour first (works for any source)
  const brand = await lookupBrandColor(entry.domain)
  if (brand) return { colors: [brand], via: 'Simple Icons brand color' }

  // Parse colours from the SVG itself
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

const shouldWrite = args.includes('--write')
const noBuild = args.includes('--no-build')
let customName = null
const nameIdx = args.indexOf('--name')
if (nameIdx !== -1) customName = args[nameIdx + 1]

const positional = args.filter((a, i) => {
  if (a.startsWith('--')) return false
  if (i > 0 && args[i - 1] === '--name') return false
  return true
})

const domains = positional.map(domainFromArg)

if (domains.length === 0) {
  console.log(`Usage: node scripts/add-icon.mjs <domain> [domain2 ...] [--name customName] [--write]

Fetches a vector SVG icon for a website and adds it to public/icons.js.
Sources tried in order: Simple Icons → site /favicon.svg → Google favicon (raster fallback).
Also suggests brand colours for use in your config.js bgColor entries.

Examples:
  node scripts/add-icon.mjs github.com --write
  node scripts/add-icon.mjs reddit.com twitch.tv --write
  node scripts/add-icon.mjs https://news.ycombinator.com --name hackernews --write

Options:
  --name <name>   Custom key name (only for single domain)
  --write         Auto-insert into public/icons.js and rebuild
  --no-build      Skip the build step after writing`)
  process.exit(0)
}

if (customName && domains.length > 1) {
  console.error('--name can only be used with a single domain')
  process.exit(1)
}

const entries = []
for (const domain of domains) {
  const name = customName || nameFromDomain(domain)
  process.stderr.write(`Fetching icon for ${domain}...`)
  try {
    const entry = await generateEntry(domain, name)
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

if (shouldWrite) {
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
} else {
  console.log('\n// Add the following to public/icons.js inside window.ICONS = { ... }:\n')
  entries.forEach(({ name, svg }, i) => {
    console.log(`  ${name}: '${svg.replace(/'/g, "\\'")}',`)
    console.log(formatColorSuggestion(colorResults[i]))
    console.log()
  })
  console.log('// Or re-run with --write to auto-insert and rebuild.')
}
