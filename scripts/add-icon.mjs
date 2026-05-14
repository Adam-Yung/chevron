#!/usr/bin/env node
import https from 'https'
import http from 'http'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const ICONS_PATH = resolve(import.meta.dirname, '..', 'public', 'icons.js')

function fetchBuffer(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (redirects <= 0) return reject(new Error('Too many redirects'))
    const client = url.startsWith('https') ? https : http
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location, redirects - 1).then(resolve, reject)
      }
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    }).on('error', reject)
  })
}

function domainFromArg(arg) {
  if (arg.includes('://')) return new URL(arg).hostname
  return arg.replace(/^www\./, '')
}

function nameFromDomain(domain) {
  return domain.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]/g, '')
}

async function generateEntry(domain, name) {
  const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  const buf = await fetchBuffer(url)
  const b64 = buf.toString('base64')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><image href="data:image/png;base64,${b64}" width="128" height="128"/></svg>`
  return { name, svg }
}

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

  const lines = entries.map(({ name, svg }) => `  ${name}: '${svg}'`)
  const insertion = (needsComma ? ',\n' : '\n') + lines.join(',\n') + '\n'

  content = before + insertion + after
  writeFileSync(ICONS_PATH, content, 'utf-8')
}

// --- CLI ---
const args = process.argv.slice(2)

const shouldWrite = args.includes('--write')
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

Examples:
  node scripts/add-icon.mjs freepacman.org --name pacman
  node scripts/add-icon.mjs github.com reddit.com --write
  node scripts/add-icon.mjs https://news.ycombinator.com --name hackernews --write

Options:
  --name <name>   Custom key name (only for single domain)
  --write         Auto-insert into public/icons.js`)
  process.exit(0)
}

if (customName && domains.length > 1) {
  console.error('--name can only be used with a single domain')
  process.exit(1)
}

const entries = []
for (const domain of domains) {
  const name = customName || nameFromDomain(domain)
  process.stderr.write(`Fetching favicon for ${domain}...`)
  try {
    const entry = await generateEntry(domain, name)
    entries.push(entry)
    process.stderr.write(' done\n')
  } catch (err) {
    process.stderr.write(` FAILED: ${err.message}\n`)
  }
}

if (entries.length === 0) {
  console.error('No icons fetched successfully.')
  process.exit(1)
}

if (shouldWrite) {
  insertIntoFile(entries)
  console.log(`Wrote ${entries.length} icon(s) to ${ICONS_PATH}:`)
  entries.forEach(e => console.log(`  • ${e.name}`))
} else {
  console.log('\n// Add the following to public/icons.js inside window.ICONS = { ... }:\n')
  entries.forEach(({ name, svg }) => {
    console.log(`  ${name}: '${svg}',`)
  })
  console.log('\n// Or re-run with --write to auto-insert.')
}
