import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NumberField from './NumberField'

function setup(value = 5) {
  const onCommit = vi.fn()
  const view = render(<NumberField value={value} min={1} max={50} step={1} onCommit={onCommit} />)
  return { input: screen.getByRole('spinbutton'), onCommit, view }
}

describe('NumberField', () => {
  it('lets the field be emptied without committing 0', () => {
    const { input, onCommit } = setup()
    fireEvent.change(input, { target: { value: '' } })
    expect(input.value).toBe('')
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('commits in-range numbers live and ignores out-of-range ones', () => {
    const { input, onCommit } = setup()
    fireEvent.change(input, { target: { value: '12' } })
    expect(onCommit).toHaveBeenLastCalledWith(12)
    fireEvent.change(input, { target: { value: '99' } })
    expect(onCommit).toHaveBeenCalledTimes(1)
  })

  it('snaps back to the stored value on blur', () => {
    const { input } = setup()
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.blur(input)
    expect(input.value).toBe('5')
  })

  it('follows an external change of the value', () => {
    const { input, view, onCommit } = setup()
    view.rerender(<NumberField value={9} min={1} max={50} step={1} onCommit={onCommit} />)
    expect(input.value).toBe('9')
  })
})
