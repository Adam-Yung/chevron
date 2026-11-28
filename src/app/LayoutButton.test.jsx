import { render, fireEvent } from '@testing-library/react'
import LayoutButton from './LayoutButton'

describe('LayoutButton', () => {
  it('remembers the first use before running the action', () => {
    const onClick = vi.fn(() => expect(localStorage.getItem('xVisited')).toBe('true'))
    const { getByRole } = render(<LayoutButton id='x' onClick={onClick} aria-label='x'>x</LayoutButton>)
    expect(localStorage.getItem('xVisited')).toBeNull()
    fireEvent.click(getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0]).toEqual([])
  })
})
