import { render, fireEvent } from '@testing-library/react'
import Cheatsheet from './Cheatsheet'

describe('Cheatsheet keys and backdrop', () => {
  it('closes on Escape and on a pointerdown on the backdrop only', () => {
    const onClose = vi.fn()
    const { getByRole } = render(<Cheatsheet open onClose={onClose} />)
    const dialog = getByRole('dialog')
    expect(fireEvent.pointerDown(dialog)).toBe(true)
    fireEvent.keyDown(dialog, { key: 'a' })
    expect(onClose).not.toHaveBeenCalled()
    expect(fireEvent.keyDown(dialog, { key: 'Escape' })).toBe(false)
    expect(fireEvent.pointerDown(dialog.parentElement)).toBe(false)
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('wraps Tab inside the dialog', () => {
    const { getByRole } = render(<Cheatsheet open onClose={() => {}} />)
    const button = getByRole('button', { name: 'Close cheatsheet' })
    button.focus()
    expect(fireEvent.keyDown(button, { key: 'Tab' })).toBe(false)
    expect(fireEvent.keyDown(button, { key: 'Tab', shiftKey: true })).toBe(false)
    expect(document.activeElement).toBe(button)
  })
})
