import { describe, it, expect } from 'vitest'
import { stripModuleMarkersFromHtml } from '../build/htmlTransforms.js'

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
