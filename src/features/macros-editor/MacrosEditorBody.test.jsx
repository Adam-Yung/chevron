import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup, within } from '@testing-library/react'
import MacrosEditorBody from './MacrosEditorBody'

const bundled = () => ({
  macros: [
    { name: 'One', url: 'https://one.test', triggers: ['a'], bgColor: { type: 'solid', color: '#111111' } },
    { name: 'Two', url: 'https://two.test', triggers: ['b'], key: 'KeyT' }
  ],
  commands: [{ type: 'search', trigger: '?' }],
  engines: { g: { name: 'Goo', bgColor: { type: 'solid', color: '#222222' }, types: { query: { template: 'https://g.test/?q={$}' } } } }
})

const stored = () => JSON.parse(localStorage.getItem('chevron.config') || 'null')
const button = name => screen.getByRole('button', { name })
const click = name => fireEvent.click(button(name))
const tab = name => fireEvent.click(screen.getByRole('tab', { name }))
const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
const status = () => screen.getByRole('status').textContent
const saveNow = () => click('Save now')
const rowTitles = () => screen.queryAllByRole('button', { expanded: false })
  .concat(screen.queryAllByRole('button', { expanded: true }))
  .filter(el => /rowTitle/.test(el.className))
const names = () => [...document.querySelectorAll('[class*="rowName"]')].map(el => el.textContent)
const openName = () => rowTitles().find(el => el.getAttribute('aria-expanded') === 'true')?.querySelector('[class*="rowName"]').textContent

const types = () => screen.getAllByLabelText('Type')
const stopInputs = () => screen.getAllByLabelText('Stop %')
const json = () => screen.getByLabelText('Config JSON')
const chips = () => screen.queryAllByRole('button', { name: /^Remove trigger/ }).map(el => el.getAttribute('aria-label').slice(15))

function savedBackground() {
  saveNow()
  return stored().macros[0].bgColor
}

async function pickFile(text) {
  const file = { name: 'f.json', text: async () => text }
  await act(async () => { fireEvent.change(screen.getByLabelText('Import JSON file'), { target: { files: [file] } }) })
}

let root
beforeEach(() => {
  window.CONFIG = bundled()
  window.ICONS = { alpha: '<svg data-i="alpha"></svg>', beta: '<svg data-i="beta"></svg>' }
  root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
})
afterEach(() => {
  cleanup()
  root.remove()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('macros tab', () => {
  it('adds a macro open at the end, moves and deletes while keeping the same row open', () => {
    render(<MacrosEditorBody />)
    click('+ Add macro')
    expect(openName()).toBe('New macro')
    click(/^One/)
    fireEvent.click(screen.getAllByRole('button', { name: 'Move down' })[0])
    expect(names()).toEqual(['Two', 'One', 'New macro'])
    expect(openName()).toBe('One')
    fireEvent.click(screen.getAllByRole('button', { name: 'Move up' })[2])
    expect(names()).toEqual(['Two', 'New macro', 'One'])
    expect(openName()).toBe('One')
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete macro' })[0])
    expect(names()).toEqual(['New macro', 'One'])
    expect(openName()).toBe('One')
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete macro' })[1])
    expect(openName()).toBeUndefined()
    saveNow()
    expect(stored().macros).toEqual([{
      name: 'New macro', category: '', triggers: [], url: 'https://example.com', normalisedURL: 'example.com',
      bgColor: { type: 'solid', color: '#888888' }, textColor: '#ffffff', pinned: false
    }])
  })

  it('toggles a row shut and drops an emptied hotkey', () => {
    render(<MacrosEditorBody />)
    click(/^Two/)
    type('Hotkey (e.g. KeyG)', '')
    type('Category', 'work')
    fireEvent.click(screen.getByLabelText('Pinned to macros menu'))
    saveNow()
    expect(stored().macros[1]).toEqual({ name: 'Two', url: 'https://two.test', triggers: ['b'], category: 'work', pinned: true })
    click(/^Two/)
    expect(openName()).toBeUndefined()
  })

})

describe('trigger chips and macro commands', () => {
  it('commits chips on Enter, comma, Tab and blur, removes with Backspace and the cross', () => {
    render(<MacrosEditorBody />)
    click(/^One/)
    const input = screen.getByRole('textbox', { name: /^Triggers/ })
    expect(fireEvent.keyDown(input, { key: 'Tab' })).toBe(true)
    type(/^Triggers/, 'x, a ,y,x')
    expect(fireEvent.keyDown(input, { key: 'Enter' })).toBe(false)
    expect(chips()).toEqual(['a', 'x', 'y'])
    expect(input.value).toBe('')
    type(/^Triggers/, 'z')
    expect(fireEvent.keyDown(input, { key: ',' })).toBe(false)
    type(/^Triggers/, 'w')
    expect(fireEvent.keyDown(input, { key: 'Tab' })).toBe(false)
    type(/^Triggers/, 'v')
    expect(fireEvent.keyDown(input, { key: 'Backspace' })).toBe(true)
    fireEvent.blur(input)
    expect(chips()).toEqual(['a', 'x', 'y', 'z', 'w', 'v'])
    expect(fireEvent.keyDown(input, { key: 'Backspace' })).toBe(false)
    click('Remove trigger a')
    expect(chips()).toEqual(['x', 'y', 'z', 'w'])
  })

  it('edits, adds, renames and removes macro commands', () => {
    render(<MacrosEditorBody />)
    click(/^One/)
    click('+ Add command')
    click('+ Add command')
    expect(types().map(el => el.value)).toEqual(['newCommand', 'newCommand1'])
    fireEvent.change(screen.getAllByLabelText('Description')[0], { target: { value: 'd' } })
    fireEvent.change(screen.getAllByLabelText('Template')[1], { target: { value: 't' } })
    fireEvent.change(types()[0], { target: { value: 'newCommand1' } })
    expect(types()[0].getAttribute('aria-invalid')).toBe('true')
    fireEvent.blur(types()[0])
    expect(types()[0].value).toBe('newCommand')
    fireEvent.change(types()[0], { target: { value: ' go ' } })
    fireEvent.blur(types()[0])
    saveNow()
    expect(stored().macros[0].commands).toEqual({ go: { template: '{@}/{$}', description: 'd' }, newCommand1: { template: 't', description: '' } })
    expect(Object.keys(stored().macros[0].commands)).toEqual(['go', 'newCommand1'])
    click('Remove command go')
    saveNow()
    expect(Object.keys(stored().macros[0].commands)).toEqual(['newCommand1'])
  })

})

describe('macro background and pickers', () => {
  it('edits a gradient: switch, colours, stops and back to solid', () => {
    render(<MacrosEditorBody />)
    click(/^One/)
    type('Background type', 'gradient')
    expect(savedBackground()).toEqual({ type: 'gradient', gradientType: 'linear', angle: 45, colors: ['#111111', '#000000'] })
    fireEvent.change(stopInputs()[0], { target: { value: '' } })
    click('+ Add color stop')
    expect(savedBackground()).toEqual({ type: 'gradient', gradientType: 'linear', angle: 45, colors: ['#111111', '#000000', '#888888'], stops: null })
    fireEvent.change(stopInputs()[1], { target: { value: '30' } })
    expect(savedBackground().stops).toEqual([null, 30, null])
    expect(document.querySelector('[class*="bgPreview"]').style.background).toContain('linear-gradient')
    click('Remove color 1')
    expect(savedBackground()).toMatchObject({ colors: ['#000000', '#888888'], stops: [30, null] })
    type('Gradient kind', 'radial')
    expect(screen.queryByLabelText('Angle (deg)')).toBeNull()
    click('Remove color 1')
    click('Remove color 1')
    expect(savedBackground()).toMatchObject({ colors: [], stops: null })
    type('Background type', 'solid')
    expect(savedBackground()).toEqual({ type: 'solid', color: '#888888' })
  })

  it('takes only complete hex values from the colour popover', () => {
    render(<MacrosEditorBody />)
    click(/^One/)
    click(/^Background color/)
    const hex = screen.getByLabelText('Background color hex value')
    expect(hex.closest('[data-keep-focus="true"]').parentElement).toBe(root)
    fireEvent.change(hex, { target: { value: 'ab' } })
    expect(hex.value).toBe('#ab')
    expect(hex.getAttribute('aria-invalid')).toBe('true')
    fireEvent.change(hex, { target: { value: 'abc' } })
    expect(button('Background color: #abc. Click to change.')).toBeTruthy()
    fireEvent.blur(hex)
    expect(hex.value).toBe('#abc')
    fireEvent.keyDown(hex, { key: 'Escape' })
    expect(screen.queryByLabelText('Background color hex value')).toBeNull()
    click(/^Background color/)
    fireEvent.pointerDown(root.querySelector('[class*="backdrop"]'))
    expect(screen.queryByLabelText('Background color hex value')).toBeNull()
  })

})

describe('icon picker', () => {
  it('searches, picks and reopens the icon picker', () => {
    render(<MacrosEditorBody />)
    click(/^One/)
    click('Pick an icon')
    const popover = within(root)
    type('Search icons', 'zzz')
    expect(popover.getByText(/No icons match/).textContent).toContain('zzz')
    type('Search icons', ' BET ')
    expect(popover.queryByRole('button', { name: 'alpha' })).toBeNull()
    fireEvent.click(popover.getByRole('button', { name: 'beta' }))
    expect(screen.queryByLabelText('Search icons')).toBeNull()
    expect(button('Icon: beta. Click to change.').querySelector('[data-i="beta"]')).toBeTruthy()
    click('Icon: beta. Click to change.')
    expect(screen.getByLabelText('Search icons').value).toBe('')
    expect(popover.getByRole('button', { name: 'beta' }).className).toContain('selected')
    click('Icon: beta. Click to change.')
    expect(screen.queryByLabelText('Search icons')).toBeNull()
  })
})

describe('commands and engines tabs', () => {
  it('edits, adds and deletes global commands', () => {
    render(<MacrosEditorBody />)
    tab('Commands')
    click('+ Add command')
    fireEvent.change(screen.getAllByLabelText('Trigger')[1], { target: { value: '!' } })
    saveNow()
    expect(stored().commands).toEqual([{ type: 'search', trigger: '?' }, { type: 'newType', trigger: '!' }])
    click('Delete command search')
    saveNow()
    expect(stored().commands).toEqual([{ type: 'newType', trigger: '!' }])
  })

  it('adds, renames and removes engines and query types', () => {
    render(<MacrosEditorBody />)
    tab('Engines')
    click('+ Add engine')
    expect(openName()).toBe('New engine')
    type('Engine id (key)', 'mine')
    fireEvent.blur(screen.getByLabelText('Engine id (key)'))
    expect(openName()).toBe('New engine')
    click('+ Add query type')
    fireEvent.change(screen.getAllByLabelText('Template')[1], { target: { value: 'https://n.test/{$}' } })
    type('Name', 'Mine')
    saveNow()
    expect(Object.keys(stored().engines)).toEqual(['g', 'mine'])
    expect(stored().engines.mine.types).toEqual({ query: { template: 'https://example.com/?q={$}' }, newType: { template: 'https://n.test/{$}' } })
    click('Remove query type query')
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete engine' })[0])
    expect(openName()).toBe('Mine')
    saveNow()
    expect(stored().engines).toMatchObject({ mine: { name: 'Mine', types: { newType: { template: 'https://n.test/{$}' } } } })
    expect(Object.keys(stored().engines)).toEqual(['mine'])
    click('Delete engine')
    expect(screen.getByText('No engines defined.')).toBeTruthy()
  })
})

describe('draft actions', () => {
  it('autosaves after the delay, reports it and calls onSaved', () => {
    vi.useFakeTimers()
    const onSaved = vi.fn()
    render(<MacrosEditorBody onSaved={onSaved} />)
    tab('Commands')
    type('Trigger', '#')
    act(() => vi.advanceTimersByTime(800))
    expect(status()).toBe('Saved.')
    expect(onSaved).toHaveBeenCalledTimes(1)
    expect(onSaved.mock.calls[0][0].commands[0].trigger).toBe('#')
  })

  it('saves with the button and with Ctrl or Cmd+S only', () => {
    render(<MacrosEditorBody />)
    const wrapper = screen.getByRole('tablist').parentElement
    expect(fireEvent.keyDown(wrapper, { key: 's' })).toBe(true)
    expect(stored()).toBeNull()
    expect(fireEvent.keyDown(wrapper, { key: 's', metaKey: true })).toBe(false)
    expect(stored().version).toBe(1)
    expect(status()).toBe('Saved. Changes apply on the next query, no reload needed.')
    localStorage.clear()
    expect(fireEvent.keyDown(wrapper, { key: 's', ctrlKey: true })).toBe(false)
    expect(stored()).not.toBeNull()
  })

  it('reports a failed save', () => {
    render(<MacrosEditorBody />)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full') })
    saveNow()
    expect(status()).toBe('Could not save: full')
  })

  it('blocks saving on bad raw JSON and keeps the last good parse when leaving', () => {
    render(<MacrosEditorBody />)
    tab('Raw JSON')
    expect(JSON.parse(json().value)).toEqual(bundled())
    const next = { ...bundled(), commands: [] }
    fireEvent.change(json(), { target: { value: JSON.stringify(next) } })
    fireEvent.change(json(), { target: { value: '{' } })
    expect(json().value).toBe('{')
    expect(json().getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByRole('alert').textContent).toMatch(/^Invalid JSON/)
    expect(button('Save now').disabled).toBe(true)
    fireEvent.keyDown(json(), { key: 's', ctrlKey: true })
    expect(stored()).toBeNull()
    tab('Raw JSON')
    expect(json().value).toBe('{')
    tab('Commands')
    expect(status()).toBe('The Raw JSON had errors, so the last valid version is shown here.')
    expect(screen.getByText('No commands defined.')).toBeTruthy()
    expect(button('Save now').disabled).toBe(false)
    tab('Raw JSON')
    expect(status().trim()).toBe('')
  })

})

describe('replacing the draft', () => {
  it('asks before replacing, then resets or loads the bundled config', () => {
    localStorage.setItem('chevron.config', JSON.stringify({ version: 1, macros: [], commands: [], engines: {} }))
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<MacrosEditorBody />)
    click('Reset to bundled')
    click('Load bundled')
    expect(names()).toEqual([])
    expect(confirm.mock.calls.map(c => c[0])).toEqual([
      'Reset to the bundled config? This replaces everything currently in the editor and is saved straight away.',
      'Load the bundled config? This replaces everything currently in the editor and is saved straight away.'
    ])
    confirm.mockReturnValue(true)
    click('Load bundled')
    expect(names()).toEqual(['One', 'Two'])
    expect(status()).toBe('Loaded the bundled config.')
    click('Reset to bundled')
    expect(status()).toBe('Reverted to the bundled config.js.')
    expect(stored()).toBeNull()
  })

  it('exports the draft', () => {
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    const clicked = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(<MacrosEditorBody />)
    click('Export JSON')
    expect(clicked).toHaveBeenCalled()
    expect(status()).toBe('Exported to chevron-config.json.')
  })

  it('imports a file, naming what went wrong', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<MacrosEditorBody />)
    await pickFile('{"macros": 3}')
    expect(status()).toBe('Could not import f.json: "macros" must be an array.')
    await pickFile('nope')
    expect(status()).toMatch(/^Could not read f\.json: /)
    await pickFile('{"macros": []}')
    expect(status()).toBe('Imported f.json.')
    expect(names()).toEqual([])
    expect(confirm).toHaveBeenLastCalledWith('Import f.json? This replaces everything currently in the editor and is saved straight away.')
    confirm.mockReturnValue(false)
    await pickFile('{"macros": [{"name":"No","url":"https://no.test"}]}')
    expect(names()).toEqual([])
  })

})

describe('reloading the draft', () => {
  it('reloads from storage when the revision changes, without saving', () => {
    vi.useFakeTimers()
    const onSaved = vi.fn()
    const view = render(<MacrosEditorBody revision={0} onSaved={onSaved} />)
    tab('Commands')
    localStorage.setItem('chevron.config', JSON.stringify({ version: 1, macros: [{ name: 'New', url: 'https://n.test' }], commands: [], engines: {} }))
    view.rerender(<MacrosEditorBody revision={1} onSaved={onSaved} />)
    expect(screen.getByRole('tab', { name: 'Macros' }).getAttribute('aria-selected')).toBe('true')
    expect(names()).toEqual(['New'])
    act(() => vi.advanceTimersByTime(2000))
    view.unmount()
    expect(onSaved).not.toHaveBeenCalled()
  })

})

describe('validation messages', () => {
  it('lists errors and warnings', () => {
    window.CONFIG = { macros: Array.from({ length: 8 }, () => ({ name: '', url: 'https://x.test', triggers: ['t'] })), commands: [], engines: {} }
    render(<MacrosEditorBody />)
    expect(screen.getByRole('alert').querySelectorAll('li')).toHaveLength(7)
    expect(screen.getByRole('alert').textContent).toContain('…and 2 more.')
    expect(button('Export JSON').disabled).toBe(true)
  })
})
