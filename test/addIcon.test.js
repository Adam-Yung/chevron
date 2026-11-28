// The offline parts of scripts/add-icon.mjs: the network is mocked, nothing is fetched or written.
import { Buffer } from 'node:buffer'
import { describe, it, expect, vi } from 'vitest'
import { fetchText, fetchBuffer } from '../scripts/icons/fetch.mjs'
import { looksLikeDomain, domainFromArg, nameFromDomain, nameFromQuery, titleToSlug, parseArgs } from '../scripts/icons/names.mjs'
import { sanitiseSvg, extractSvgColors, formatColorSuggestion } from '../scripts/icons/svg.mjs'
import { mergeIcons } from '../scripts/icons/iconsFile.mjs'
import { generateEntryFromDomain, generateEntryFromSearch, suggestColors } from '../scripts/icons/sources.mjs'

vi.mock('../scripts/icons/fetch.mjs', () => ({ fetchText: vi.fn(), fetchBuffer: vi.fn() }))

const RAW = 'https://raw.githubusercontent.com/'
const SI = `${RAW}simple-icons/simple-icons/develop/`
const SVG = '<svg viewBox="0 0 1 1"></svg>'
const CLEAN = '<svg fill="currentColor" viewBox="0 0 1 1"></svg>'

async function answer(table, asked, url) {
  asked.push(url)
  if (url in table) return table[url]
  throw new Error('HTTP 404')
}

// Answers each URL from the table and records the order of requests; anything else fails like a 404.
function serve(table) {
  const asked = []
  fetchText.mockImplementation(url => answer(table, asked, url))
  fetchBuffer.mockImplementation(async url => Buffer.from(await answer(table, asked, url)))
  return asked
}

describe('names and arguments', () => {
  it('tells a domain or URL from a search phrase', () => {
    expect(['github.com', 'https://x', 'a.b.io'].map(looksLikeDomain)).toEqual([true, true, true])
    expect(['pacman', 'stock market', 'v1.2', 'chess knight.com'].map(looksLikeDomain)).toEqual([false, false, false, false])
  })

  it('derives the domain and the key name', () => {
    expect(domainFromArg('https://www.news.example.com/a')).toBe('www.news.example.com')
    expect(domainFromArg('www.github.com')).toBe('github.com')
    expect(nameFromDomain('news.y-combinator.com')).toBe('newsycombinator')
    expect(nameFromQuery('Chess Knight!')).toBe('chessknight')
    expect(titleToSlug('C++ & .NET')).toBe('cplusplusanddotnet')
  })

  it('reads the flags and keeps the --name value out of the positional arguments', () => {
    expect(parseArgs(['a.com', '--name', 'x', '--no-build', '--write'])).toEqual({ noBuild: true, customName: 'x', positional: ['a.com'] })
    expect(parseArgs(['a.com', 'b'])).toEqual({ noBuild: false, customName: null, positional: ['a.com', 'b'] })
    expect(parseArgs(['--name'])).toEqual({ noBuild: false, customName: undefined, positional: [] })
  })
})

describe('SVG handling', () => {
  it('strips the preamble, comments and title, joins lines and adds a fill', () => {
    expect(sanitiseSvg('<?xml version="1.0"?>\n<!-- c -->\n<svg viewBox="0 0 1 1">\n  <title>T</title></svg>\n')).toBe('<svg fill="currentColor" viewBox="0 0 1 1"> </svg>')
    expect(sanitiseSvg('<svg fill="red"></svg>')).toBe('<svg fill="red"></svg>')
  })

  it('collects distinct colours, widening short hex and dropping black and white', () => {
    const svg = '<a fill="#ABC" stroke="#000"/><b style="fill:#aabbcc"/><c fill=#ffffff /><d stroke=\'#12345678\'/>'
    expect(extractSvgColors(svg)).toEqual(['#aabbcc', '#12345678'])
  })

  it('words the colour suggestion for none, one and several colours', () => {
    expect(formatColorSuggestion(null)).toBe('  (no color suggestion available)')
    expect(formatColorSuggestion({ colors: ['#111111'], via: 'v' })).toBe("  Suggested bgColor (v):  { type: 'solid', color: '#111111' }")
    expect(formatColorSuggestion({ colors: ['#1', '#2'], via: 'v' }))
      .toBe("  Suggested bgColor (v):  { type: 'gradient', gradientType: 'linear', angle: 45, colors: ['#1', '#2'] }")
  })
})

describe('mergeIcons', () => {
  const file = "window.ICONS = {\n  a: '<svg/>'\n}\n"

  it('adds entries before the closing brace and escapes single quotes', () => {
    expect(mergeIcons(file, [{ name: 'b', svg: "<svg x='1'/>" }, { name: 'c', svg: '<svg/>' }])).toEqual({
      skipped: [],
      content: "window.ICONS = {\n  a: '<svg/>',\n  b: '<svg x=\\'1\\'/>',\n  c: '<svg/>'\n}\n"
    })
  })

  it('adds no comma after an opening brace', () => {
    expect(mergeIcons('window.ICONS = {\n}\n', [{ name: 'b', svg: 'S' }]).content).toBe("window.ICONS = {\n  b: 'S'\n}\n")
  })

  it('skips names already present, and writes nothing when none are left', () => {
    expect(mergeIcons(file, [{ name: 'a', svg: 'S' }])).toEqual({ skipped: ['a'], content: null })
    const mixed = mergeIcons(file, [{ name: 'a', svg: 'S' }, { name: 'b', svg: 'S' }])
    expect(mixed.skipped).toEqual(['a'])
    expect(mixed.content).toContain("  b: 'S'")
  })

  it('reports a file without a closing brace', () => {
    expect(mergeIcons('nothing', [{ name: 'a', svg: 'S' }])).toBeNull()
  })
})

describe('icon sources', () => {
  it('takes the first domain source that answers', async () => {
    const asked = serve({ [`${SI}icons/github.svg`]: SVG })
    expect(await generateEntryFromDomain('github.com', 'gh'))
      .toEqual({ name: 'gh', svg: CLEAN, source: 'Simple Icons', domain: 'github.com', isSearch: false })
    expect(asked).toEqual([`${SI}icons/github.svg`])
  })

  it('falls back to the site favicon, then to a raster favicon, skipping non-SVG answers', async () => {
    const google = 'https://www.google.com/s2/favicons?domain=a.com&sz=128'
    const asked = serve({ [`${SI}icons/a.svg`]: 'nope', 'https://a.com/favicon.svg': '<html>', [google]: 'PNG' })
    const entry = await generateEntryFromDomain('a.com', 'a')
    expect(entry.source).toBe('Google favicon (raster)')
    expect(entry.svg).toBe('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">' +
      '<image href="data:image/png;base64,UE5H" width="128" height="128"/></svg>')
    expect(asked).toEqual([`${SI}icons/a.svg`, 'https://a.com/favicon.svg', google])
    serve({ 'https://b.com/favicon.svg': SVG })
    expect((await generateEntryFromDomain('b.com', 'b')).source).toBe('site favicon.svg')
    serve({})
    await expect(generateEntryFromDomain('c.com', 'c')).rejects.toThrow('All icon sources failed')
  })

  it('builds an SVG from the first Iconify result', async () => {
    serve({
      'https://api.iconify.design/search?query=pac%20man&limit=1': '{"icons":["tabler:pacman"]}',
      'https://api.iconify.design/tabler.json?icons=pacman': '{"width":32,"icons":{"pacman":{"body":"<path/>"}}}'
    })
    expect(await generateEntryFromSearch('pac man', 'p')).toEqual({
      name: 'p', source: 'Iconify', query: 'pac man', isSearch: true,
      svg: '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 24"><path/></svg>'
    })
  })

  it('then tries Game Icons, preferring exact over prefix, and then a fuzzy brand title', async () => {
    const games = `${RAW}game-icons/icons/master/`
    const asked = serve({
      [`${games}index.json`]: '["big-rocket", {"name":"rocket-ship"}, {}]',
      [`${games}svg/ffffff/transparent/rocket-ship.svg`]: SVG,
      [`${SI}data/simple-icons.json`]: '[{"title":"Spot.ify","hex":"1DB954"}]',
      [`${SI}icons/spotdotify.svg`]: SVG
    })
    expect((await generateEntryFromSearch('Rocket', 'r')).source).toBe('Game Icons')
    expect(asked.at(-1)).toBe(`${games}svg/ffffff/transparent/rocket-ship.svg`)
    expect((await generateEntryFromSearch('spot', 's')).source).toBe('Simple Icons (fuzzy)')
    await expect(generateEntryFromSearch('zzz', 'z')).rejects.toThrow('All search sources failed')
  })

  it('suggests the brand colour for a domain, else colours found in the SVG, else nothing', async () => {
    serve({ [`${SI}data/simple-icons.json`]: '[{"title":"Spot.ify","hex":"1DB954"}]' })
    expect(await suggestColors({ isSearch: false, domain: 'spotdotify.com', svg: '' }))
      .toEqual({ colors: ['#1DB954'], via: 'Simple Icons brand color' })
    expect(await suggestColors({ isSearch: false, domain: 'unknown.com', svg: '<a fill="#123456"/>' }))
      .toEqual({ colors: ['#123456'], via: 'extracted from SVG' })
    expect(await suggestColors({ isSearch: true, svg: '' })).toBeNull()
  })
})
