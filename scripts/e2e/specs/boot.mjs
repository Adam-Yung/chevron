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

  async 'static build also boots from file://'(app) {
    const page = await app.context.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    await page.goto(pathToFileURL(join(app.dist, 'index.html')).href)
    await page.waitForSelector('textarea[role="combobox"]')
    assert(errors.length === 0, 'file:// page errors: ' + errors.join(' | '))
    const fontLoaded = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('16px Onest') })
    assert(fontLoaded, 'the Onest font did not load from file://')
    // Rejects if a declared face cannot load; passes while the display face has not been added.
    await page.evaluate(() => Promise.all([...document.fonts].filter(f => f.family.includes('Graduate')).map(f => f.load())))
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
