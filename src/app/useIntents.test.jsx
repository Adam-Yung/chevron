import { act, renderHook } from '@testing-library/react'
import { SettingsContext, ColorSchemeContext } from '../settings/SettingsProvider'
import { UiStoreProvider, createUiStore } from '../state/UiStore'
import { ui } from '../state/ui'
import useIntents from './useIntents'

const sites = [
  { name: 'Alpha', url: 'https://alpha.test', pinned: true, key: 'KeyA', triggers: ['al'] },
  { name: 'Beta', url: 'https://beta.test', pinned: true, key: 'KeyB', triggers: ['be'] }
]
const settings = { general: { redirectTarget: '_blank', searchHistory: false }, query: { forceSearchEngineOnCtrl: true, AI: { enabled: true } } }

const providers = store => function Providers({ children }) {
  return (
    <SettingsContext.Provider value={settings}>
      <ColorSchemeContext.Provider value='light'>
        <UiStoreProvider store={store}>{children}</UiStoreProvider>
      </ColorSchemeContext.Provider>
    </SettingsContext.Provider>
  )
}

const performOn = (result, intent) => act(() => { result.current.perform(intent) })
const openMenuOn = store => act(() => { store.dispatch(ui.macrosToggled(true)) })

function mount() {
  const store = createUiStore()
  const { result, rerender } = renderHook(() => useIntents(), { wrapper: providers(store) })
  return { store, result, rerender, perform: performOn.bind(null, result), openMenu: openMenuOn.bind(null, store) }
}

describe('useIntents sites menu', () => {
  let open
  let previous
  beforeEach(() => {
    previous = window.CONFIG
    window.CONFIG = { macros: sites, commands: [], engines: {} }
    open = vi.spyOn(window, 'open').mockImplementation(() => null)
  })
  afterEach(() => {
    window.CONFIG = previous
    open.mockRestore()
  })
  it('keeps stable handlers across renders', () => {
    const { result, rerender } = mount()
    const first = result.current
    rerender()
    expect(result.current.perform).toBe(first.perform)
    expect(result.current.openMacro).toBe(first.openMacro)
  })

  it('opens by cursor, by hotkey and directly, within the filtered list', () => {
    const { result, perform, openMenu } = mount()
    openMenu()
    perform({ intent: 'menuSubmit' })
    openMenu()
    perform({ intent: 'filterInput', char: 'b' })
    perform({ intent: 'menuSubmit' })
    perform({ intent: 'menuHotkey', code: 'KeyB' })
    perform({ intent: 'menuHotkey', code: 'KeyZ' })
    act(() => { result.current.openMacro(sites[0], true) })
    act(() => { result.current.openMacro(undefined) })
    expect(open.mock.calls.map(c => c[0])).toEqual(['https://alpha.test', 'https://beta.test', 'https://beta.test', 'https://alpha.test'])
  })

  it('moves the cursor over the filtered count and edits the filter', () => {
    const { store, perform, openMenu } = mount()
    openMenu()
    perform({ intent: 'menuMove', delta: -1 })
    expect(store.getState().menuCursor).toBe(1)
    perform({ intent: 'filterInput', char: 'a' })
    perform({ intent: 'menuMove', delta: 1 })
    expect(store.getState().menuCursor).toBe(0)
    perform({ intent: 'filterBackspace' })
    expect(store.getState().macroFilter).toBe('')
  })
})
