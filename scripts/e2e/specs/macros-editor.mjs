// The macros editor inside Settings: editing, validation, persistence, and that saved macros work immediately.
import { assert, assertEqual } from '../lib/app.mjs'

const AUTOSAVE_WAIT = 1300

async function openEditor(app) {
  const { page } = app
  await page.click('[aria-label="Open settings"]')
  await page.click('nav[aria-label="Settings sections"] >> text=Macros')
  await page.waitForSelector('text=Save now')
}

const editorTab = (app, name) => app.page.getByRole('tablist').last().getByRole('tab', { name }).click()
const stored = app => app.page.evaluate(() => JSON.parse(localStorage.getItem('chevron.config') || 'null'))

async function addMacro(app, { name, url, triggers }) {
  const { page } = app
  await page.getByRole('button', { name: '+ Add macro' }).click()
  await page.getByLabel('Name', { exact: true }).fill(name)
  await page.getByLabel('URL', { exact: true }).fill(url)
  const chips = page.getByLabel(/^Triggers/)
  for (const trigger of triggers) {
    await chips.fill(trigger)
    await chips.press('Enter')
  }
}

async function closeSettings(app) {
  await app.page.click('[aria-label="Close settings"]')
  await app.page.waitForSelector('[aria-label="Settings"]', { state: 'detached' })
}

export default {
  async 'a saved macro works at once: its trigger suggests it and Enter navigates'(app) {
    await openEditor(app)
    await addMacro(app, { name: 'Zed', url: 'https://zed.test/', triggers: ['zzz'] })
    await app.page.getByRole('button', { name: 'Save now' }).click()
    await closeSettings(app)
    await app.page.keyboard.type('zzz')
    await app.page.waitForSelector('text=Zed')
    await app.page.keyboard.press('Enter')
    await app.page.waitForFunction(() => document.title === 'outside' || location.href.includes('zed.test'), null, { timeout: 4000 })
    assert(app.navigations.some(n => n.url === 'https://zed.test/'), 'navigated to the macro URL')
  },

  async 'closing Settings right after an edit still saves it'(app) {
    await openEditor(app)
    await addMacro(app, { name: 'Quick', url: 'https://quick.test/', triggers: ['qq'] })
    await closeSettings(app)
    const config = await stored(app)
    assert(config?.macros.some(m => m.name === 'Quick' && m.triggers.includes('qq')), 'edit persisted on close')
  },

  async 'edits persist across a reload'(app) {
    await openEditor(app)
    await addMacro(app, { name: 'Keeper', url: 'https://keeper.test/', triggers: ['kp'] })
    await app.page.waitForTimeout(AUTOSAVE_WAIT)
    // Opening Settings writes an empty `settings` blob that the app cannot boot from (reported separately); drop it so this test
    // exercises only the macro config.
    await app.page.evaluate(() => localStorage.removeItem('settings'))
    await app.page.reload()
    await app.page.waitForSelector('textarea[role="combobox"]')
    await openEditor(app)
    await app.page.getByRole('button', { name: /^Keeper/ }).waitFor()
  },

  async 'macros can be reordered and deleted'(app) {
    await openEditor(app)
    await addMacro(app, { name: 'Last', url: 'https://last.test/', triggers: ['ls'] })
    await app.page.getByRole('button', { name: 'Save now' }).click()
    const before = (await stored(app)).macros.length
    await app.page.getByRole('button', { name: 'Move up' }).last().click()
    await app.page.getByRole('button', { name: 'Save now' }).click()
    const names = (await stored(app)).macros.map(m => m.name)
    assertEqual(names[names.length - 2], 'Last', 'moved up one place')
    await app.page.getByRole('button', { name: 'Delete macro' }).nth(before - 2).click()
    await app.page.getByRole('button', { name: 'Save now' }).click()
    const after = (await stored(app)).macros.map(m => m.name)
    assertEqual(after.length, before - 1, 'one macro deleted')
    assert(!after.includes('Last'), 'the deleted macro is gone')
  },

  async 'trigger chips: add, ignore duplicates, remove'(app) {
    await openEditor(app)
    await addMacro(app, { name: 'Chips', url: 'https://chips.test/', triggers: ['aa', 'bb', 'aa'] })
    const removeButtons = app.page.getByRole('button', { name: /^Remove trigger/ })
    assertEqual(await removeButtons.count(), 2, 'duplicate chip dropped')
    await app.page.getByRole('button', { name: 'Remove trigger aa' }).click()
    assertEqual(await removeButtons.count(), 1, 'chip removed')
  },

  async 'raw JSON: invalid JSON is rejected and nothing is saved'(app) {
    await openEditor(app)
    await editorTab(app, 'Raw JSON')
    await app.page.getByLabel('Config JSON').fill('{ "macros": [')
    await app.page.getByRole('alert').getByText(/Invalid JSON/).waitFor()
    assert(await app.page.getByRole('button', { name: 'Save now' }).isDisabled(), 'Save now is disabled')
    await app.page.waitForTimeout(AUTOSAVE_WAIT)
    assertEqual(await stored(app), null, 'nothing written to storage')
  },

  async 'raw JSON: a javascript: URL is rejected with the macro and field named'(app) {
    await openEditor(app)
    await editorTab(app, 'Raw JSON')
    const area = app.page.getByLabel('Config JSON')
    const config = JSON.parse(await area.inputValue())
    config.macros[0].url = 'javascript:alert(1)'
    await area.fill(JSON.stringify(config, null, 2))
    const name = config.macros[0].name
    await app.page.getByRole('alert').getByText(`Macro "${name}" (#1), URL`).waitFor()
    await app.page.waitForTimeout(AUTOSAVE_WAIT)
    assertEqual(await stored(app), null, 'nothing written to storage')
    assertEqual(await app.page.evaluate(() => window.CONFIG.macros[0].url.startsWith('javascript')), false, 'live config untouched')
  },

  async 'a macro with a forbidden URL in the form is named and not saved'(app) {
    const position = await app.page.evaluate(() => window.CONFIG.macros.length) + 1
    await openEditor(app)
    await addMacro(app, { name: 'Bad', url: 'javascript:alert(1)', triggers: ['bad'] })
    await app.page.getByRole('alert').getByText(`Macro "Bad" (#${position}), URL`).waitFor()
    await app.page.waitForTimeout(AUTOSAVE_WAIT)
    assertEqual(await stored(app), null, 'nothing written to storage')
  },

  async 'typing in editor fields never reaches the search field or the macros menu'(app) {
    await openEditor(app)
    await app.page.getByRole('button', { name: 'Add macro' }).or(app.page.getByRole('button', { name: '+ Add macro' })).click()
    const name = app.page.getByLabel('Name', { exact: true })
    await name.focus()
    await app.page.keyboard.press('Shift')
    await app.page.keyboard.type('hello')
    assertEqual(await app.query(), '', 'search field stays empty')
    assert(await app.view() !== 'macros', 'macros menu did not open')
    await app.page.getByRole('button', { name: /^Background color/ }).click()
    await app.page.getByLabel('Background color hex value').focus()
    await app.page.keyboard.press('Shift')
    assert(await app.view() !== 'macros', 'Shift in the colour popover did not open the menu')
  },

  async 'an engine id cannot be cleared away or duplicated'(app) {
    await openEditor(app)
    await editorTab(app, 'Engines')
    await app.page.getByRole('button', { name: '+ Add engine' }).click()
    const id = app.page.getByLabel('Engine id (key)')
    await id.fill('')
    await id.blur()
    assertEqual(await id.inputValue(), 'newEngine', 'empty id reverts')
    await id.fill('google')
    await id.blur()
    assertEqual(await id.inputValue(), 'newEngine', 'an id already in use reverts')
    await id.fill('mine')
    await id.blur()
    await app.page.getByRole('button', { name: /mine$/ }).waitFor()
  },

  async 'narrow screens: the editor fits without sideways scrolling'(app) {
    await app.page.setViewportSize({ width: 390, height: 844 })
    await openEditor(app)
    await app.page.getByRole('button', { name: '+ Add macro' }).click()
    const overflow = await app.page.evaluate(() => {
      const wide = [...document.querySelectorAll('[aria-label="Settings"] [role="tablist"] ~ *, [aria-label="Settings"] [role="tablist"]')].flatMap(e => [e, ...e.querySelectorAll('*')]).filter(e => e.getBoundingClientRect().right > innerWidth + 1)
      return wide.map(e => e.tagName + '.' + e.className).slice(0, 5)
    })
    assertEqual(overflow.length, 0, 'elements wider than the viewport: ' + overflow.join(', '))
  }
}
