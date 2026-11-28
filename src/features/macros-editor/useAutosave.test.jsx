import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAutosave } from './useAutosave'

const render = (props, save) => renderHook(p => useAutosave({ save, ...p }), { initialProps: props })

describe('useAutosave', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('saves after the delay, not on mount', () => {
    const save = vi.fn(() => true)
    const { rerender } = render({ value: 1, valid: true }, save)
    vi.advanceTimersByTime(2000)
    expect(save).not.toHaveBeenCalled()
    rerender({ value: 2, valid: true })
    vi.advanceTimersByTime(799)
    expect(save).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(save).toHaveBeenCalledWith(2)
  })

  it('flushes a pending edit on unmount (closing the modal must not lose it)', () => {
    const save = vi.fn(() => true)
    const { rerender, unmount } = render({ value: 1, valid: true }, save)
    rerender({ value: 2, valid: true })
    unmount()
    expect(save).toHaveBeenCalledWith(2)
  })

  it('never saves an invalid value', () => {
    const save = vi.fn(() => true)
    const { rerender, unmount } = render({ value: 1, valid: true }, save)
    rerender({ value: 2, valid: false })
    vi.advanceTimersByTime(2000)
    unmount()
    expect(save).not.toHaveBeenCalled()
  })

  it('markClean suppresses the save for a value already persisted', () => {
    const save = vi.fn(() => true)
    const { rerender, result } = render({ value: 1, valid: true }, save)
    rerender({ value: 2, valid: true })
    result.current.markClean(2)
    vi.advanceTimersByTime(2000)
    expect(save).not.toHaveBeenCalled()
  })
})
