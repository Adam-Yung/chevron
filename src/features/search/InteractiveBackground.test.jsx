import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SettingsContext } from '../../settings/SettingsProvider'
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

const rows = container => container.querySelectorAll(`.${classes['row'].split(' ')[0]}`)

describe('InteractiveBackground markup', () => {
  it('lays out two halves of rows and lines, and sets its variables', () => {
    const { container } = renderBg({ marqueeText: 'github', textColor: 'red' })
    expect(rows(container)).toHaveLength(12)
    expect(rows(container)[0].children).toHaveLength(15)
    expect(rows(container)[0].children[0].textContent).toBe('github')
    expect(container.firstChild.getAttribute('style')).toBe(
      '--diagonal: 1000px; --rotation-angle: 330deg; --text-color: red; --text-size: 5vmin; --text-opacity: 0.2; --secondary: #123456;')
    const marquee = rows(container)[0].parentElement.parentElement
    expect(marquee.getAttribute('style')).toBe('--marquee-duration: 14.4s;')
    expect(marquee.getAttribute('aria-hidden')).toBe('true')
  })

  it('doubles the rows for a short word', () => {
    const { container } = renderBg({ marqueeText: 'gh' })
    expect(rows(container)).toHaveLength(24)
  })

  it('draws no marquee without text', () => {
    const { container } = renderBg()
    expect(rows(container)).toHaveLength(0)
  })
})
