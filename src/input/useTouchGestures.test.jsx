import { act, render, fireEvent } from '@testing-library/react'
import { UiStoreProvider, createUiStore } from '../state/UiStore'
import { ui } from '../state/ui'
import { GESTURE_MACRO_PAGE } from './gestureEvents'
import useTouchGestures from './useTouchGestures'

function Probe({ enabled }) {
  useTouchGestures(enabled)
  return (
    <div>
      <p>screen</p>
      <div data-scrollable><span>list</span></div>
      <textarea id='chevron-query' />
    </div>
  )
}

function mount(enabled = true) {
  const store = createUiStore()
  const view = render(<UiStoreProvider store={store}><Probe enabled={enabled} /></UiStoreProvider>)
  return { store, view, screen: view.getByText('screen'), field: view.container.querySelector('textarea') }
}

function swipe(target, dx, dy) {
  act(() => {
    fireEvent.touchStart(target, { touches: [{ clientX: 200, clientY: 200 }] })
    fireEvent.touchEnd(target, { changedTouches: [{ clientX: 200 + dx, clientY: 200 + dy }] })
  })
}

describe('useTouchGestures', () => {
  it('opens, pages and closes the menu', () => {
    const { store, screen } = mount()
    const onPage = vi.fn()
    window.addEventListener(GESTURE_MACRO_PAGE, onPage)
    swipe(screen, 0, -100)
    expect(store.getState().view).toBe('macros')
    swipe(screen, -100, 0)
    swipe(screen, 100, 0)
    expect(onPage.mock.calls.map(([e]) => e.detail.dir)).toEqual(['+', '-'])
    swipe(screen, 0, 100)
    expect(store.getState().view).toBe('idle')
    window.removeEventListener(GESTURE_MACRO_PAGE, onPage)
  })

  it('focuses the field on a left swipe and clears a search on a right swipe', () => {
    const { store, screen, field } = mount()
    swipe(screen, -100, 0)
    expect(document.activeElement).toBe(field)
    act(() => { store.dispatch(ui.typed('cats')) })
    swipe(screen, 100, 0)
    expect(store.getState().query).toBe('')
    expect(document.activeElement).not.toBe(field)
  })

  it('ignores scrollable lists, cancelled touches, two fingers and overlays', () => {
    const { store, view, screen } = mount()
    swipe(view.getByText('list'), 0, -100)
    act(() => {
      fireEvent.touchStart(screen, { touches: [{ clientX: 200, clientY: 200 }] })
      fireEvent.touchCancel(screen)
      fireEvent.touchEnd(screen, { changedTouches: [{ clientX: 200, clientY: 50 }] })
      fireEvent.touchStart(screen, { touches: [{ clientX: 200, clientY: 200 }, { clientX: 1, clientY: 1 }] })
      fireEvent.touchEnd(screen, { changedTouches: [{ clientX: 200, clientY: 50 }] })
    })
    expect(store.getState().view).toBe('idle')
    act(() => { store.dispatch(ui.overlayOpened('settings')) })
    swipe(screen, 0, -100)
    expect(store.getState().view).toBe('idle')
  })

  it('does nothing when turned off', () => {
    const { store, screen } = mount(false)
    swipe(screen, 0, -100)
    expect(store.getState().view).toBe('idle')
  })
})
