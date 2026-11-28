import { forwardRef, useImperativeHandle } from 'react'
import { render, fireEvent } from '@testing-library/react'
import { SettingsContext } from '../../settings/SettingsProvider'
import { UiStoreProvider } from '../../state/UiStore'
import { emitMacroPage } from '../../input/gestureEvents'
import MacrosMenu from './MacrosMenu'

const go = vi.hoisted(() => ({ calls: [] }))

vi.mock('@splidejs/react-splide', () => ({
  Splide: forwardRef(function Splide({ children }, ref) {
    useImperativeHandle(ref, () => ({ splide: { go: dir => go.calls.push(dir) } }))
    return <section>{children}</section>
  }),
  SplideSlide: ({ children }) => <div>{children}</div>
}))
vi.mock('@splidejs/splide-extension-grid', () => ({ Grid: {} }))

const settings = { menu: { columns: 3, rows: 2, gap: 4 }, appearance: {} }
const menu = active => (
  <SettingsContext.Provider value={settings}>
    <UiStoreProvider><MacrosMenu active={active} onOpen={() => {}} /></UiStoreProvider>
  </SettingsContext.Provider>
)
const wheel = (view, deltaX, deltaY = 0) => fireEvent.wheel(view.container.firstChild, { deltaX, deltaY })

describe('MacrosMenu paging', () => {
  beforeEach(() => { go.calls = []; vi.useFakeTimers() })
  afterEach(() => vi.useRealTimers())

  it('turns one page per accumulated sideways scroll and forgets a partial one', () => {
    const view = render(menu(true))
    expect(wheel(view, 100)).toBe(false)
    expect(go.calls).toEqual([])
    wheel(view, 100)
    expect(go.calls).toEqual(['+'])
    wheel(view, -100)
    vi.advanceTimersByTime(380)
    wheel(view, -100)
    expect(go.calls).toEqual(['+'])
    wheel(view, -100)
    expect(go.calls).toEqual(['+', '-'])
    expect(wheel(view, 10, 100)).toBe(true)
  })

  it('pages on the gesture event, and listens to nothing while inactive', () => {
    const view = render(menu(true))
    emitMacroPage('+')
    emitMacroPage('sideways')
    expect(go.calls).toEqual(['+'])
    view.rerender(menu(false))
    emitMacroPage('-')
    wheel(view, 500)
    expect(go.calls).toEqual(['+'])
  })
})
