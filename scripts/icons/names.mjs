// Command-line arguments of add-icon.mjs, and the names derived from them. Pure.

export function parseArgs(args) {
  const noBuild = args.includes('--no-build')
  const nameIdx = args.indexOf('--name')
  const customName = nameIdx === -1 ? null : args[nameIdx + 1]
  const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1] === '--name'))
  return { noBuild, customName, positional }
}

// A URL, or a spaceless word ending in a letters-only TLD; anything else is a search phrase.
export function looksLikeDomain(arg) {
  if (arg.includes('://')) return true
  return /^[^\s]+\.[a-zA-Z]{2,}$/.test(arg)
}

export function domainFromArg(arg) {
  if (arg.includes('://')) return new URL(arg).hostname
  return arg.replace(/^www\./, '')
}

export function nameFromDomain(domain) {
  return domain.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]/g, '')
}

export function nameFromQuery(query) {
  return query.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
}

// Simple Icons' file name for a brand title.
export function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/\+/g, 'plus')
    .replace(/\./g, 'dot')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '')
}
