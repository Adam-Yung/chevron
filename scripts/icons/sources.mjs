// Where add-icon.mjs looks for an icon and its colour, in order of preference: docs/code/scripts/icons/sources.mjs.md.
import { fetchText, fetchBuffer } from './fetch.mjs'
import { nameFromDomain, titleToSlug } from './names.mjs'
import { sanitiseSvg, extractSvgColors } from './svg.mjs'

const SIMPLE_ICONS = 'https://raw.githubusercontent.com/simple-icons/simple-icons/develop'
const GAME_ICONS = 'https://raw.githubusercontent.com/game-icons/icons/master'

async function fetchSvg(url) {
  const text = await fetchText(url)
  if (!text.includes('<svg')) throw new Error('Not an SVG response')
  return sanitiseSvg(text)
}

let simpleIconsData = null

async function getSimpleIconsData() {
  if (simpleIconsData) return simpleIconsData
  const text = await fetchText(`${SIMPLE_ICONS}/data/simple-icons.json`)
  simpleIconsData = Object.values(JSON.parse(text))
  return simpleIconsData
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

// ── Domain icon sources ───────────────────────────────────────────────

function trySimpleIcons(domain) {
  return fetchSvg(`${SIMPLE_ICONS}/icons/${nameFromDomain(domain).toLowerCase()}.svg`)
}

function trySiteFaviconSvg(domain) {
  return fetchSvg(`https://${domain}/favicon.svg`)
}

// Always a PNG, so it is embedded as a base64 <image> inside an SVG.
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

let gameIconsIndex = null

async function getGameIconsIndex() {
  if (gameIconsIndex) return gameIconsIndex
  const data = JSON.parse(await fetchText(`${GAME_ICONS}/index.json`))
  gameIconsIndex = (Array.isArray(data) ? data : []).map(e => (typeof e === 'string' ? e : e.name ?? '')).filter(Boolean)
  return gameIconsIndex
}

async function tryGameIcons(query) {
  const index = await getGameIconsIndex()
  const q = query.toLowerCase().replace(/\s+/g, '-')
  const match = index.find(n => n === q)
    || index.find(n => n.startsWith(q))
    || index.find(n => n.includes(q))
  if (!match) throw new Error('No Game Icons match')
  return fetchSvg(`${GAME_ICONS}/svg/ffffff/transparent/${match}.svg`)
}

async function trySimpleIconsFuzzy(query) {
  const icons = await getSimpleIconsData()
  const q = query.toLowerCase().replace(/\s+/g, '')
  const match = icons.find(i => titleToSlug(i.title).includes(q) || q.includes(titleToSlug(i.title)))
  if (!match) throw new Error('No Simple Icons fuzzy match')
  return fetchSvg(`${SIMPLE_ICONS}/icons/${titleToSlug(match.title)}.svg`)
}

const SEARCH_SOURCES = [
  { name: 'Iconify', fn: tryIconify },
  { name: 'Game Icons', fn: tryGameIcons },
  { name: 'Simple Icons (fuzzy)', fn: trySimpleIconsFuzzy },
]

// ── Entry generation ─────────────────────────────────────────────────

export async function generateEntryFromDomain(domain, name) {
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

export async function generateEntryFromSearch(query, name) {
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

export async function suggestColors(entry) {
  if (!entry.isSearch) {
    const brand = await lookupBrandColor(entry.domain)
    if (brand) return { colors: [brand], via: 'Simple Icons brand color' }
  }
  const svgColors = extractSvgColors(entry.svg)
  if (svgColors.length > 0) return { colors: svgColors, via: 'extracted from SVG' }
  return null
}
