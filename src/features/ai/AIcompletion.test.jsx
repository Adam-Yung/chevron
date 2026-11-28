import { render, fireEvent } from '@testing-library/react'
import { SettingsContext } from '../../settings/SettingsProvider'
import AIcompletion from './AIcompletion'

// An unconfigured provider shows its hint without any request.
const settings = { query: { AI: { enabled: true, provider: 'openai' } } }
const panel = (query, onClose) => (
  <SettingsContext.Provider value={settings}><AIcompletion query={query} onClose={onClose} /></SettingsContext.Provider>
)

describe('AIcompletion dismissal', () => {
  it('hides on close, tells the owner, and reopens for a new query', () => {
    const onClose = vi.fn()
    const view = render(panel('one', onClose))
    fireEvent.click(view.getByRole('button', { name: 'Close AI answer' }))
    expect(view.queryByTestId('ai-panel')).toBeNull()
    expect(onClose).toHaveBeenCalledTimes(1)
    view.rerender(panel('two', onClose))
    expect(view.queryByTestId('ai-panel')).not.toBeNull()
  })

  it('closes on Escape inside the panel without an owner', () => {
    const view = render(panel('one'))
    fireEvent.keyDown(view.getByTestId('ai-panel'), { key: 'Escape' })
    expect(view.queryByTestId('ai-panel')).toBeNull()
  })
})
