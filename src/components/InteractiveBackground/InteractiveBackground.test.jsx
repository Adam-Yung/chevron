import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SettingsContext } from '../../contexts/Settings'
import InteractiveBackground from './InteractiveBackground'
import classes from './InteractiveBackground.module.css'

// Minimal settings slice the component reads (chevron.quickLook.marquee).
const settingsStub = { chevron: { quickLook: { marquee: true } } }

function renderBg(props) {
  return render(
    <SettingsContext.Provider value={settingsStub}>
      <InteractiveBackground
        width={800}
        height={600}
        color={{ type: 'solid', color: '#123456' }}
        {...props}
      />
    </SettingsContext.Provider>
  )
}

describe('InteractiveBackground pause control', () => {
  it('does not apply the paused class by default', () => {
    const { container } = renderBg()
    const viewport = container.querySelector(`.${classes['viewport'].split(' ')[0]}`)
    expect(viewport).not.toBeNull()
    expect(viewport.className).not.toContain(classes['paused'])
  })

  it('applies the paused class when paused=true', () => {
    const { container } = renderBg({ paused: true })
    // The paused class is appended to the viewport element.
    const paused = container.querySelector(`.${classes['paused']}`)
    expect(paused).not.toBeNull()
  })
})
