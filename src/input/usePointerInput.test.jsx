import { act, render, fireEvent } from '@testing-library/react'
import { UiStoreProvider, createUiStore } from '../state/UiStore'
import { ui } from '../state/ui'
import usePointerInput from './usePointerInput'

function Probe({ wheelEnabled }) {
  usePointerInput({ wheelEnabled })
  return (
    <div>
      <p>empty space</p>
      <button type='button'>control</button>
      <div className='splide'><span>card gap</span></div>
      <div data-scrollable><span>list</span></div>
      <textarea id='chevron-query' />
    </div>
  )
}

function mount(wheelEnabled = true) {
  const store = createUiStore()
  const view = render(<UiStoreProvider store={store}><Probe wheelEnabled={wheelEnabled} /></UiStoreProvider>)
  return { store, view, get: view.getByText, field: view.container.querySelector('textarea') }
}

const openMenu = store => act(() => { store.dispatch(ui.macrosToggled(false)) })
const wheel = (target, deltaY, deltaX = 0) => act(() => { fireEvent.wheel(target, { deltaY, deltaX }) })

describe('pointer focus keeping', () => {
  it('gives the caret back to the field on a click on empty space only', () => {
    const { get, field } = mount()
    expect(fireEvent.mouseDown(get('control'))).toBe(true)
    expect(document.activeElement).not.toBe(field)
    expect(fireEvent.mouseDown(get('empty space'))).toBe(false)
    expect(document.activeElement).toBe(field)
    expect(fireEvent.mouseDown(get('empty space'))).toBe(true)
  })

  it('leaves the field alone while an overlay is open', () => {
    const { store, get, field } = mount()
    act(() => { store.dispatch(ui.overlayOpened('settings')) })
    fireEvent.mouseDown(get('empty space'))
    expect(document.activeElement).not.toBe(field)
    expect(fireEvent.contextMenu(get('empty space'))).toBe(true)
  })

  it('closes the menu on a primary click outside the grid', () => {
    const { store, get } = mount()
    openMenu(store)
    act(() => { fireEvent.mouseDown(get('card gap')) })
    act(() => { fireEvent.mouseDown(get('empty space'), { button: 2 }) })
    expect(store.getState().view).toBe('macros')
    act(() => { fireEvent.mouseDown(get('empty space')) })
    expect(store.getState().view).toBe('idle')
  })

  it('toggles the menu on right-click, except on controls and on a field with text', () => {
    const { store, get, field } = mount()
    expect(fireEvent.contextMenu(get('control'))).toBe(true)
    act(() => { fireEvent.contextMenu(field) })
    expect(store.getState().view).toBe('macros')
    act(() => { fireEvent.contextMenu(get('empty space')) })
    expect(store.getState().view).toBe('idle')
    act(() => { store.dispatch(ui.typed('x')) })
    expect(fireEvent.contextMenu(field)).toBe(true)
  })
})

describe('wheel toggle', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(100000) })
  afterEach(() => vi.useRealTimers())

  it('accumulates scroll, then waits out a cooldown before toggling again', () => {
    const { store, get } = mount()
    wheel(get('empty space'), -80)
    expect(store.getState().view).toBe('idle')
    wheel(get('empty space'), -80)
    expect(store.getState().view).toBe('macros')
    wheel(get('empty space'), 200)
    expect(store.getState().view).toBe('macros')
    act(() => { vi.advanceTimersByTime(900) })
    wheel(get('empty space'), 200)
    expect(store.getState().view).toBe('idle')
  })

  it('forgets a partial scroll after a pause', () => {
    const { store, get } = mount()
    wheel(get('empty space'), -80)
    act(() => { vi.advanceTimersByTime(450) })
    wheel(get('empty space'), -80)
    expect(store.getState().view).toBe('idle')
  })

  it('ignores sideways scroll and scrollable lists', () => {
    const { store, get } = mount()
    wheel(get('empty space'), -200, 300)
    wheel(get('list'), -200)
    expect(store.getState().view).toBe('idle')
  })

  it('does nothing when turned off', () => {
    const { store, get } = mount(false)
    wheel(get('empty space'), -200)
    expect(store.getState().view).toBe('idle')
  })
})
