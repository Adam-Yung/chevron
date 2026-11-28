import { act, render, fireEvent } from '@testing-library/react'
import { UiStoreProvider, createUiStore } from '../state/UiStore'
import { ui } from '../state/ui'
import useKeyboard from './useKeyboard'

function Probe(props) {
  useKeyboard(props)
  return <textarea id='chevron-query' />
}

function mount() {
  const store = createUiStore()
  const perform = vi.fn()
  const view = render(
    <UiStoreProvider store={store}><Probe perform={perform} hotkeys={new Set()} hasSuggestions={() => false} /></UiStoreProvider>
  )
  return { store, perform, view, field: view.container.querySelector('textarea') }
}

const intents = perform => perform.mock.calls.map(([i]) => i.intent)

afterEach(() => vi.useRealTimers())

describe('useKeyboard', () => {
  it('routes a keydown and prevents the default of a claimed key', () => {
    const { perform } = mount()
    expect(fireEvent.keyDown(window, { key: 'Escape' })).toBe(false)
    expect(intents(perform)).toEqual(['escape'])
  })

  it('ignores IME composition', () => {
    const { perform } = mount()
    fireEvent.keyDown(window, { key: 'Escape', isComposing: true })
    expect(perform).not.toHaveBeenCalled()
  })

  it('toggles on a quick Shift tap only', () => {
    vi.useFakeTimers()
    const { perform } = mount()
    fireEvent.keyDown(window, { key: 'Shift' })
    vi.advanceTimersByTime(100)
    fireEvent.keyUp(window, { key: 'Shift' })
    expect(intents(perform)).toEqual(['toggleMacros'])

    fireEvent.keyDown(window, { key: 'Shift' })
    vi.advanceTimersByTime(500)
    fireEvent.keyUp(window, { key: 'Shift' })
    fireEvent.keyDown(window, { key: 'Shift' })
    fireEvent.keyDown(window, { key: 'A', shiftKey: true })
    fireEvent.keyUp(window, { key: 'Shift' })
    fireEvent.keyDown(window, { key: 'Shift' })
    fireEvent.blur(window)
    fireEvent.keyUp(window, { key: 'Shift' })
    expect(intents(perform).filter(i => i === 'toggleMacros')).toHaveLength(1)
  })

})

describe('useKeyboard state', () => {
  it('mirrors Ctrl into the store and drops it on blur', () => {
    const { store } = mount()
    act(() => { fireEvent.keyDown(window, { key: 'Control', ctrlKey: true }) })
    expect(store.getState().forceEngine).toBe(true)
    act(() => { fireEvent.keyUp(window, { key: 'Control' }) })
    expect(store.getState().forceEngine).toBe(false)
    act(() => { fireEvent.keyDown(window, { key: 'Control', ctrlKey: true }) })
    act(() => { fireEvent.blur(window) })
    expect(store.getState().forceEngine).toBe(false)
  })

  it('asks the AI on a double space in the field, not on spaces typed elsewhere', () => {
    vi.useFakeTimers()
    const { store, perform, field } = mount()
    act(() => { store.dispatch(ui.typed('cats')) })
    fireEvent.keyDown(window, { key: ' ' })
    fireEvent.keyDown(window, { key: ' ' })
    expect(intents(perform)).not.toContain('askAI')
    field.focus()
    fireEvent.keyDown(field, { key: ' ' })
    vi.advanceTimersByTime(100)
    fireEvent.keyDown(field, { key: ' ' })
    expect(intents(perform)).toContain('askAI')
  })

  it('stops listening on unmount', () => {
    const { perform, view } = mount()
    view.unmount()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(perform).not.toHaveBeenCalled()
  })
})
