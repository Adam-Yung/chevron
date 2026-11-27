// The page boots clean and typing reaches the search field from the first keystroke.
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { assert, assertEqual } from '../lib/app.mjs'

export default {
  async 'boots with the search field focused and no page errors'(app) {
    const focused = await app.page.evaluate(() => document.activeElement?.getAttribute('role'))
    assertEqual(focused, 'combobox', 'focused element role')
  },

  async 'typing anywhere lands in the search field'(app) {
    await app.page.keyboard.type('hello')
    assertEqual(await app.query(), 'hello', 'query text')
  },

  // The chevron itself becomes the search curve: stripe at the blob's tip, and no straight line left on the screen edge.
  async 'while searching the chevron is the curve around the blob'(app) {
    await app.page.keyboard.type('hello')
    await app.settle(900)
    const alpha = await app.page.evaluate(() => {
      const canvas = document.querySelector('canvas[aria-hidden="true"]')
      const rect = canvas.getBoundingClientRect()
      const copy = new OffscreenCanvas(Math.round(rect.width), Math.round(rect.height)).getContext('2d')
      copy.drawImage(canvas, 0, 0, rect.width, rect.height)
      const at = (x, y) => copy.getImageData(Math.round(x - rect.left), Math.round(y - rect.top), 1, 1).data[3]
      const reach = Math.min(window.innerHeight * 0.5, window.innerWidth)
      return { tip: at(reach, window.innerHeight / 2), edge: at(2, window.innerHeight / 2) }
    })
    assertEqual(alpha.tip, 255, 'stripe at the tip of the blob')
    assertEqual(alpha.edge, 0, 'nothing on the left edge at mid-height')
  },

  // Slowed right down so each beat can be sampled: at speed 2000 the line lands at 1.6 s and the widest swing is near 2.9 s.
  async 'into search the chevron becomes a line, then springs past the curve and settles'(app) {
    await app.context.addInitScript(() => localStorage.setItem('settings', '{"general":{"animationSpeed":2000}}'))
    await app.goto()
    await app.page.keyboard.type('h')
    const rightmost = () => app.page.evaluate(() => {
      const canvas = document.querySelector('canvas[aria-hidden="true"]')
      const rect = canvas.getBoundingClientRect()
      const row = new OffscreenCanvas(window.innerWidth, 1).getContext('2d')
      row.drawImage(canvas, rect.left, rect.top - window.innerHeight / 2, rect.width, rect.height)
      const { data } = row.getImageData(0, 0, window.innerWidth, 1)
      let x = window.innerWidth - 1
      while (x >= 0 && data[x * 4 + 3] < 250) x--
      return x
    })
    await app.settle(1650)
    assert(await rightmost() < 40, 'a straight line on the edge between the two beats')
    await app.settle(1250)
    const swung = await rightmost()
    await app.settle(4000)
    const rest = await rightmost()
    assert(swung > rest + 40, `swings well past the curve: ${swung} then ${rest}`)
  },

  async 'escaping before the curve has sprung out never flashes the full fill'(app) {
    await app.context.addInitScript(() => localStorage.setItem('settings', '{"general":{"animationSpeed":2000}}'))
    await app.goto()
    await app.page.keyboard.type('h')
    await app.settle(200)
    await app.page.keyboard.press('Escape')
    await app.settle(50)
    const width = await app.page.$eval('[class*="quicklook"]', e => e.getBoundingClientRect().width)
    assert(width < 40, 'fill width just after Escape: ' + width)
  },

  async 'with reduced motion the search curve is simply there'(app) {
    await app.page.emulateMedia({ reducedMotion: 'reduce' })
    await app.page.keyboard.type('h')
    await app.settle(120)
    const alpha = await app.page.evaluate(() => {
      const canvas = document.querySelector('canvas[aria-hidden="true"]')
      const rect = canvas.getBoundingClientRect()
      const dot = new OffscreenCanvas(1, 1).getContext('2d')
      dot.drawImage(canvas, rect.left - window.innerHeight / 2, rect.top - window.innerHeight / 2, rect.width, rect.height)
      return dot.getImageData(0, 0, 1, 1).data[3]
    })
    assertEqual(alpha, 255, 'stripe at the tip of the curve one moment after typing')
  },

  async 'static build also boots from file://'(app) {
    const page = await app.context.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    await page.goto(pathToFileURL(join(app.dist, 'index.html')).href)
    await page.waitForSelector('textarea[role="combobox"]')
    assert(errors.length === 0, 'file:// page errors: ' + errors.join(' | '))
    const fontLoaded = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('16px Onest') })
    assert(fontLoaded, 'the Onest font did not load from file://')
    // fonts.check passes for an undeclared family, so ask for the face itself.
    const displayFaces = await page.evaluate(async () =>
      (await Promise.all([...document.fonts].filter(f => f.family.includes('Graduate')).map(f => f.load()))).length)
    assertEqual(displayFaces, 1, 'Graduate faces loaded from file://')
    // file:// draws the chevron on the main thread, which must hand over from the first-paint shell too.
    await page.waitForSelector('#boot-shell', { state: 'detached', timeout: 3000 })
  },

  async 'boots cleanly over an empty or partial settings blob'(app) {
    for (const blob of ['{}', '{"appearance":{}}', '{"general":{"redirectTarget":"_blank"}}']) {
      await app.context.addInitScript(b => localStorage.setItem('settings', b), blob)
      await app.goto()
      await app.page.keyboard.type('x')
      assertEqual(await app.query(), 'x', 'typing after boot with ' + blob)
    }
  }
}
