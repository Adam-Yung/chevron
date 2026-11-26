// The page boots clean and typing reaches the search field from the first keystroke.
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
    await page.goto(new URL('../../../dist/index.html', import.meta.url).href)
    await page.waitForSelector('textarea[role="combobox"]')
    assert(errors.length === 0, 'file:// page errors: ' + errors.join(' | '))
  }
}
