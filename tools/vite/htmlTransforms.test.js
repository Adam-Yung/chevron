import { describe, it, expect } from 'vitest'
import { stripModuleMarkersFromHtml, moveAppScriptToBodyEnd, prepareStaticHtml, inlineFonts, inlineFontCss } from './htmlTransforms.js'

describe('stripModuleMarkersFromHtml', () => {
  it('drops crossorigin from <script> tags (file:// / IIFE compat)', () => {
    const out = stripModuleMarkersFromHtml(
      '<script type="module" crossorigin src="/assets/index.js"></script>'
    )
    expect(out).not.toContain('crossorigin')
    // module → defer so the IIFE bundle is not CORS-gated
    expect(out).toContain('<script defer src="/assets/index.js">')
  })

  it('PRESERVES crossorigin on a font <link rel="preload"> (no double-fetch)', () => {
    const input =
      '<link rel="preload" href="fonts/Onest/Onest.woff2" as="font" type="font/woff2" crossorigin>'
    expect(stripModuleMarkersFromHtml(input)).toBe(input)
  })

  it('removes modulepreload hints', () => {
    const out = stripModuleMarkersFromHtml(
      '<link rel="modulepreload" href="/assets/x.js">\n<title>Chevron</title>'
    )
    expect(out).not.toContain('modulepreload')
    expect(out).toContain('<title>Chevron</title>')
  })

  it('leaves a plain stylesheet link untouched', () => {
    const input = '<link rel="stylesheet" href="font.css">'
    expect(stripModuleMarkersFromHtml(input)).toBe(input)
  })

  it('handles a realistic hosted <head> end-to-end', () => {
    const input = [
      '<link rel="preload" href="fonts/Onest/Onest.woff2" as="font" type="font/woff2" crossorigin>',
      '<link rel="stylesheet" href="font.css">',
      '<link rel="modulepreload" href="/chevron/assets/vendor.js">',
      '<script type="module" crossorigin src="/chevron/assets/index.js"></script>'
    ].join('\n')
    const out = stripModuleMarkersFromHtml(input)
    // font preload keeps crossorigin
    expect(out).toContain('as="font" type="font/woff2" crossorigin')
    // script loses crossorigin + module
    expect(out).toContain('<script defer src="/chevron/assets/index.js">')
    expect(out).not.toContain('type="module"')
    // modulepreload gone
    expect(out).not.toContain('modulepreload')
  })
})

describe('moveAppScriptToBodyEnd', () => {
  const page = [
    '<html><head>',
    '<script defer src="./assets/index.abc.js"></script>',
    '</head><body><div id="root"></div>',
    '<script src="config.js"></script>',
    '<script src="icons.js"></script>',
    '</body></html>'
  ].join('\n')

  it('runs the bundle after config.js and icons.js, which define window.CONFIG and window.ICONS', () => {
    const out = moveAppScriptToBodyEnd(page)
    expect(out.indexOf('icons.js')).toBeLessThan(out.indexOf('assets/index.abc.js'))
    expect(out.indexOf('assets/index.abc.js')).toBeLessThan(out.indexOf('</body>'))
    expect(out.match(/assets\/index/g)).toHaveLength(1)
  })

  it('drops defer, which an inlined script ignores anyway', () => {
    expect(moveAppScriptToBodyEnd(page)).toContain('<script src="./assets/index.abc.js"></script>')
  })

  it('leaves a page without an app bundle untouched', () => {
    const plain = '<html><body><script src="config.js"></script></body></html>'
    expect(moveAppScriptToBodyEnd(plain)).toBe(plain)
  })

  it('composes with stripModuleMarkersFromHtml for the static build', () => {
    const vitePage = page.replace('<script defer src', '<script type="module" crossorigin src')
    const out = prepareStaticHtml(vitePage)
    expect(out).not.toContain('type="module"')
    expect(out.indexOf('icons.js')).toBeLessThan(out.indexOf('assets/index.abc.js'))
  })
})

describe('inlineFonts', () => {
  const head = '<head><link rel="preload" href="fonts/Onest/Onest.woff2" as="font" type="font/woff2" crossorigin>\n<link rel="stylesheet" href="font.css">\n</head>'
  const css = "/* note */ @font-face { font-family: 'Onest'; src: url('./fonts/Onest/Onest.woff2') format('woff2'); }"

  it('swaps the font links for an inline @font-face carrying the font as a data URL', () => {
    const out = inlineFonts(head, css, { './fonts/Onest/Onest.woff2': 'AAAA' })
    expect(out).not.toContain('href="font.css"')
    expect(out).not.toContain('rel="preload"')
    expect(out).toContain("url('data:font/woff2;base64,AAAA')")
    expect(out).not.toContain('note')
  })

  it('leaves a page without the font stylesheet alone', () => {
    expect(inlineFonts('<head></head>', css, {})).toBe('<head></head>')
  })
})

describe('inlineFontCss', () => {
  const head = '<head><link rel="preload" href="fonts/Onest/Onest.woff2" as="font" type="font/woff2" crossorigin>\n<link rel="stylesheet" href="font.css">\n</head>'
  const css = "/* note */ @font-face { font-family: 'Onest'; src: url('./fonts/Onest/Onest.woff2') format('woff2'); }"

  it('replaces the render-blocking font.css request with the same rules inline', () => {
    const out = inlineFontCss(head, css)
    expect(out).not.toContain('href="font.css"')
    expect(out).toContain("<style>@font-face { font-family: 'Onest'; src: url('./fonts/Onest/Onest.woff2') format('woff2'); }</style>")
    expect(out).not.toContain('note')
  })

  it('keeps the font preload, so the font file still starts downloading from the first parse', () => {
    expect(inlineFontCss(head, css)).toContain('rel="preload" href="fonts/Onest/Onest.woff2" as="font" type="font/woff2" crossorigin')
  })

  it('leaves a page without the font stylesheet alone', () => {
    expect(inlineFontCss('<head></head>', css)).toBe('<head></head>')
  })
})
