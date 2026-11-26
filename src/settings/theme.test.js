import settings from './schema'
import Color from '../lib/color'

const { themes } = settings.defaults.appearance

// APCA lightness contrast between the stitch and the stripe it is sewn on; below about 25 a thin dashed line disappears.
const visible = ({ seam, chevron }) => Math.abs(new Color(chevron).contrast(seam))

describe('theme colours', () => {
  it('keeps the default stripe colour instead of following the text colour', () => {
    expect(themes.default.dark.chevron).toBe('#d9a02b')
    expect(themes.default.light.chevron).toBe('#a8402c')
  })

  it.each(Object.keys(themes))('%s: the stitch shows on the chevron in both schemes', name => {
    for (const scheme of ['light', 'dark']) {
      expect(visible(themes[name][scheme]), scheme).toBeGreaterThan(25)
    }
  })
})
