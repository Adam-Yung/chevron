#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'
import { parseArgs, looksLikeDomain, domainFromArg, nameFromDomain, nameFromQuery } from './icons/names.mjs'
import { generateEntryFromDomain, generateEntryFromSearch, suggestColors } from './icons/sources.mjs'
import { formatColorSuggestion } from './icons/svg.mjs'
import { mergeIcons } from './icons/iconsFile.mjs'

const ICONS_PATH = resolve(import.meta.dirname, '..', 'public', 'icons.js')

const USAGE = `Usage: npm run icons -- <domain|query> [domain|query ...] [--name customName] [--no-build]

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
  --no-build      Skip the rebuild step after writing`

async function fetchEntry(arg, customName) {
  const isDomain = looksLikeDomain(arg)
  const name = customName || (isDomain ? nameFromDomain(domainFromArg(arg)) : nameFromQuery(arg))
  const label = isDomain ? domainFromArg(arg) : `"${arg}"`
  const mode = isDomain ? 'domain' : 'search'
  process.stderr.write(`Fetching icon for ${label} (${mode})...`)
  try {
    const entry = isDomain
      ? await generateEntryFromDomain(domainFromArg(arg), name)
      : await generateEntryFromSearch(arg, name)
    process.stderr.write(` done (${entry.source})\n`)
    return entry
  } catch (err) {
    process.stderr.write(` FAILED: ${err.message}\n`)
    return null
  }
}

// One at a time, so the progress lines do not interleave.
async function fetchEntries(positional, customName) {
  const entries = []
  for (const arg of positional) {
    const entry = await fetchEntry(arg, customName)
    if (entry) entries.push(entry)
  }
  return entries
}

function insertIntoFile(entries) {
  const merged = mergeIcons(readFileSync(ICONS_PATH, 'utf-8'), entries)
  if (!merged) {
    console.error('Could not find closing } in', ICONS_PATH)
    process.exit(1)
  }
  if (merged.skipped.length > 0) {
    console.error(`Skipping already-existing icon(s): ${merged.skipped.join(', ')}`)
  }
  if (merged.content !== null) writeFileSync(ICONS_PATH, merged.content, 'utf-8')
}

function report(entries, colorResults) {
  console.log(`Wrote ${entries.length} icon(s) to ${ICONS_PATH}:`)
  entries.forEach((e, i) => {
    console.log(`  • ${e.name} (via ${e.source})`)
    console.log(formatColorSuggestion(colorResults[i]))
  })
}

function rebuild() {
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

async function main(args) {
  const { noBuild, customName, positional } = parseArgs(args)

  if (positional.length === 0) {
    console.log(USAGE)
    process.exit(0)
  }
  if (customName && positional.length > 1) {
    console.error('--name can only be used with a single argument')
    process.exit(1)
  }

  const entries = await fetchEntries(positional, customName)
  if (entries.length === 0) {
    console.error('No icons fetched successfully.')
    process.exit(1)
  }

  // Colour suggestions are best-effort, so they run in parallel.
  process.stderr.write('Looking up brand colours...')
  const colorResults = await Promise.all(entries.map(e => suggestColors(e)))
  process.stderr.write(' done\n')

  insertIntoFile(entries)
  report(entries, colorResults)
  if (!noBuild) rebuild()
}

await main(process.argv.slice(2))
