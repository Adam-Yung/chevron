// Every way the old start page could get stuck, replayed in Chromium. Each spec ends by checking the page is usable again.
import { assert, assertEqual } from '../lib/app.mjs'

const NEW_TAB = { general: { redirectTarget: '_blank' } }

async function expectCleanIdle(app, what) {
  await app.waitView('idle').catch(() => {})
  assertEqual(await app.view(), 'idle', `${what}: view`)
  assertEqual(await app.query(), '', `${what}: query`)
  assert(!(await app.page.$('[data-leaving]')), `${what}: still showing a navigation`)
  await app.page.keyboard.type('ok')
  assertEqual(await app.query(), 'ok', `${what}: typing works again`)
}

// An init script, not a direct write: the app flushes its own settings on pagehide and would overwrite a write made before reload.
async function reopen(app, settings) {
  await app.context.addInitScript(s => localStorage.setItem('settings', s), JSON.stringify(settings))
  await app.goto()
}

const mailSite = (trigger, color) =>
  ({ name: 'Mail', triggers: [trigger], url: `https://${trigger}.test`, bgColor: { type: 'solid', color } })

export default {
  async 'searching in a new tab leaves a clean, usable start page'(app) {
    await reopen(app, NEW_TAB)
    await app.page.keyboard.type('cats')
    const popup = app.context.waitForEvent('page')
    await app.page.keyboard.press('Enter')
    const tab = await popup
    await tab.waitForLoadState()
    assert(tab.url().includes('q=cats'), 'new tab url: ' + tab.url())
    await tab.close()
    await app.page.bringToFront()
    await expectCleanIdle(app, 'after closing the search tab')
  },

  async 'Alt+Enter opens a new tab even when results normally open here'(app) {
    await app.page.keyboard.type('dogs')
    const popup = app.context.waitForEvent('page')
    await app.page.keyboard.press('Alt+Enter')
    await (await popup).close()
    await expectCleanIdle(app, 'after Alt+Enter')
  },

  async 'Enter navigates at once, without waiting for an animation'(app) {
    await app.page.keyboard.type('fast')
    const pressed = Date.now()
    await app.page.keyboard.press('Enter')
    await app.page.waitForSelector('#outside')
    const delay = app.navigations[0].at - pressed
    assert(delay < 150, `navigation started ${delay} ms after Enter`)
  },

  async 'coming back with the back button shows a blank start page'(app) {
    await app.page.keyboard.type('back test')
    await app.page.keyboard.press('Enter')
    await app.page.waitForSelector('#outside')
    await app.page.goBack()
    await app.page.waitForSelector('textarea[role="combobox"]', { state: 'attached' })
    await expectCleanIdle(app, 'after back')
  },

  async 'a navigation that never leaves the page is released'(app) {
    await app.context.route(/q=nowhere/, route => route.fulfill({ status: 204 }))
    await app.page.keyboard.type('nowhere')
    await app.page.keyboard.press('Enter')
    await app.page.waitForTimeout(4500)
    await expectCleanIdle(app, 'after a 204 navigation')
  },

  async 'a site launched by its trigger keeps its banner on the growing disc'(app) {
    // A 204 keeps the start page up, so the launch screen can be read.
    await app.context.route(/youtube\.com/, route => route.fulfill({ status: 204 }))
    await app.page.keyboard.type('y')
    await app.page.keyboard.press('Enter')
    await app.page.waitForSelector('[data-launch] svg', { state: 'attached', timeout: 2000 })
    assertEqual(await app.page.textContent('[data-launch-name]'), 'YouTube', 'launch screen name')
    const banner = await app.page.textContent('[data-launch] > div:first-child')
    assert(banner.includes('YouTubeYouTube'), 'the scrolling banner is missing: ' + banner.slice(0, 40))
    // It grows from the blob on the left edge, not from the site's badge in the faded dock.
    const clip = await app.page.$eval('[data-launch] > div:first-child', e => e.style.clipPath)
    assert(clip.includes('at 0px'), 'disc should be centred on the left edge: ' + clip)
  },

  async 'two sites with one name each launch with their own colour'(app) {
    const config = { macros: [mailSite('one', '#ff0000'), mailSite('two', '#0000ff')], commands: [], engines: {} }
    await app.context.addInitScript(c => localStorage.setItem('chevron.config', JSON.stringify(c)), config)
    await app.context.route(/two\.test/, route => route.fulfill({ status: 204 }))
    await app.goto()
    await app.page.keyboard.type('two')
    await app.page.keyboard.press('Enter')
    await app.page.waitForSelector('[data-launch]', { state: 'attached', timeout: 2000 })
    const felt = await app.page.$eval('[data-launch] > div:first-child', e => e.style.getPropertyValue('--felt'))
    assertEqual(felt, '#0000ff', 'launch screen colour')
  },

  async 'Tab puts the highlighted suggestion in the field and typing carries on'(app) {
    await app.page.keyboard.type('cats')
    await app.page.waitForSelector('[role="option"] >> text=cats one')
    await app.page.keyboard.press('Tab')
    await app.page.keyboard.press('Tab')
    assertEqual(await app.query(), 'cats one', 'query after Tab, Tab')
    await app.page.keyboard.type('!')
    assertEqual(await app.query(), 'cats one!', 'caret should be at the end')
  },

  async 'typing and clearing quickly leaves no search blob behind'(app) {
    for (let i = 0; i < 5; i++) {
      await app.page.keyboard.type('ab')
      await app.page.keyboard.press('Escape')
    }
    await app.page.keyboard.type('x')
    await app.page.keyboard.press('Backspace')
    await app.settle(700)
    assert(!(await app.page.$('[data-active]')), 'search blob still shown')
    await expectCleanIdle(app, 'after rapid clears')
  },

  async 'a capital first letter types instead of opening the sites menu'(app) {
    await app.page.keyboard.type('Hello')
    assertEqual(await app.view(), 'search', 'view')
    assertEqual(await app.query(), 'Hello', 'query')
  },

  async 'tapping Shift toggles the menu, and any number of taps ends consistent'(app) {
    for (let i = 0; i < 5; i++) await app.page.keyboard.press('Shift')
    await app.waitView('macros')
    assert(await app.page.$('[data-open]'), 'menu layer not open')
    await app.page.keyboard.press('Shift')
    await app.waitView('idle')
    await app.settle(500)
    assert(!(await app.page.$('[data-open]')), 'menu layer still open')
  },

  async 'the sites menu filters as you type and Enter opens the match'(app) {
    await app.page.keyboard.press('Shift')
    await app.waitView('macros')
    await app.page.keyboard.type('git')
    await app.page.keyboard.press('Enter')
    await app.page.waitForSelector('#outside')
    assert(app.navigations[0].url.includes('github.com'), 'opened ' + app.navigations[0].url)
  },

  async 'Escape steps back from the filtered menu to a clean idle'(app) {
    await app.page.keyboard.press('Shift')
    await app.page.keyboard.type('zzz')
    await app.page.getByText('no sites match').waitFor({ timeout: 2000 })
    await app.page.keyboard.press('Escape')
    assertEqual(await app.view(), 'macros', 'first Esc clears the filter')
    await app.page.keyboard.press('Escape')
    await expectCleanIdle(app, 'after Esc Esc')
  },

  async 'closing the shortcuts sheet gives typing back to the search field'(app) {
    await app.page.keyboard.press('?')
    await app.page.getByRole('dialog').waitFor()
    await app.page.keyboard.press('Escape')
    await app.page.getByRole('dialog').waitFor({ state: 'detached' }).catch(() => {})
    await expectCleanIdle(app, 'after the cheatsheet')
  },

  async 'clicking empty space keeps typing in the search field'(app) {
    await app.page.mouse.click(300, 200)
    await app.page.keyboard.type('click')
    assertEqual(await app.query(), 'click', 'query')
  },

  async 'typing while a button has focus still reaches the search field'(app) {
    await app.page.focus('nav[aria-label="Pinned sites"] button')
    await app.page.keyboard.type('focus')
    assertEqual(await app.query(), 'focus', 'query')
  },

  async 'Shift+Delete forgets a history entry'(app) {
    await app.page.keyboard.type('secret plans')
    await app.page.keyboard.press('Enter')
    await app.page.waitForSelector('#outside')
    await app.page.goBack()
    await app.page.waitForSelector('textarea[role="combobox"]', { state: 'attached' })
    await app.page.keyboard.type('secret')
    await app.page.locator('[data-type="history"]').waitFor()
    await app.page.keyboard.press('ArrowDown')
    await app.page.keyboard.press('Shift+Delete')
    await app.settle(200)
    assertEqual(await app.page.locator('[data-type="history"]').count(), 0, 'history suggestions left')
  },

  async 'Enter on a math question copies the answer instead of searching'(app) {
    await app.context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await app.page.keyboard.type('2+2')
    await app.page.locator('[data-type="calculator"]').waitFor()
    await app.page.keyboard.press('Enter')
    await app.page.getByText('Copied').waitFor()
    assertEqual(await app.page.evaluate(() => navigator.clipboard.readText()), '4', 'clipboard')
    assertEqual(app.navigations.length, 0, 'navigations')
  },

  async 'right-clicking a suggestion does not open it'(app) {
    await app.page.keyboard.type('cats')
    const option = app.page.locator('[role="option"]').first()
    await option.waitFor()
    await option.click({ button: 'right' })
    await app.settle(300)
    assertEqual(app.navigations.length, 0, 'navigations')
    assertEqual(await app.query(), 'cats', 'query kept')
  },

  async 'a focused corner button activates with Enter'(app) {
    await app.page.focus('[aria-label="Open settings"]')
    await app.page.keyboard.press('Enter')
    await app.page.locator('[data-keep-focus]').first().waitFor()
  },

  async 'a long word without spaces types at full speed'(app) {
    const started = Date.now()
    await app.page.keyboard.type('x'.repeat(80))
    const ms = Date.now() - started
    assertEqual((await app.query()).length, 80, 'query length')
    assert(ms < 2000, `80 keystrokes took ${ms} ms`)
  },

  async 'spaces alone never start a search'(app) {
    await app.page.keyboard.press('Space')
    await app.page.keyboard.press('Space')
    await app.page.keyboard.press('Enter')
    await app.settle(200)
    assertEqual(await app.view(), 'idle', 'view')
    assertEqual(app.navigations.length, 0, 'navigations')
  }
}
