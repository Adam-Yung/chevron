import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { UiStoreProvider, createUiStore } from '../state/UiStore'
import { ui } from '../state/ui'
import useNavigationRelease, { LEAVING_TIMEOUT_MS } from './useNavigationRelease'

function Probe() {
  useNavigationRelease()
  return null
}

function mount() {
  const store = createUiStore()
  render(<UiStoreProvider store={store}><Probe /></UiStoreProvider>)
  act(() => {
    store.dispatch(ui.typed('cats'))
    store.dispatch(ui.leaving('https://example.com'))
  })
  return store
}

afterEach(() => vi.useRealTimers())

describe('useNavigationRelease', () => {
  it('a bfcache restore returns to a blank start page', () => {
    const store = mount()
    act(() => { window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true })) })
    expect(store.getState().leaving).toBeNull()
    expect(store.getState().query).toBe('')
  })

  it('a navigation that never leaves is released after the timeout', () => {
    vi.useFakeTimers()
    const store = mount()
    act(() => { vi.advanceTimersByTime(LEAVING_TIMEOUT_MS - 1) })
    expect(store.getState().leaving).not.toBeNull()
    act(() => { vi.advanceTimersByTime(1) })
    expect(store.getState().leaving).toBeNull()
    expect(store.getState().view).toBe('idle')
  })

  it('unrelated dispatches do not postpone the timeout', () => {
    vi.useFakeTimers()
    const store = mount()
    act(() => { vi.advanceTimersByTime(LEAVING_TIMEOUT_MS - 10) })
    act(() => { store.dispatch(ui.forceEngineChanged(true)) })
    act(() => { vi.advanceTimersByTime(10) })
    expect(store.getState().leaving).toBeNull()
  })

  it('the tab becoming visible again releases it', () => {
    const store = mount()
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(store.getState().leaving).toBeNull()
  })
})
