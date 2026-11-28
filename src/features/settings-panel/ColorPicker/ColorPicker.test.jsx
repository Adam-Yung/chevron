import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ColorPicker from './ColorPicker'

beforeAll(() => { Element.prototype.scrollIntoView = vi.fn() })

const contrast = { name: 'secondary', isBackground: true, color: '#ffffff' }

const field = () => screen.queryByPlaceholderText('Type color in HEX format')
const type = value => fireEvent.change(field(), { target: { value } })
const parts = name => [...document.querySelectorAll(`[class*="${name}"]`)]
const part = name => parts(name)[0] ?? null
const swatch = () => document.querySelector('button')
const open = () => fireEvent.click(swatch())

function setup(props) {
  const onChange = vi.fn()
  const view = render(<ColorPicker value="#000000" onChange={onChange} {...props} />)
  return { onChange, view }
}

describe('settings ColorPicker', () => {
  it('paints the swatch with its colour and a readable label', () => {
    setup({ fullWidth: true })
    const trigger = swatch()
    expect(trigger.textContent).toBe('#000000')
    expect(trigger.style.background).toBe('rgb(0, 0, 0)')
    expect(trigger.style.color).toBe('rgb(238, 238, 238)')
    expect(trigger.style.width).toBe('100%')
    expect(field()).toBeNull()
  })

  it('applies only a parsable colour, on the check', () => {
    const { onChange } = setup()
    open()
    type('nonsense-colour')
    fireEvent.click(parts('btn-half')[1])
    expect(onChange).not.toHaveBeenCalled()
    expect(field()).not.toBeNull()
    type('#123456')
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(parts('btn-half')[1])
    expect(onChange).toHaveBeenCalledWith('#123456')
    expect(field()).toBeNull()
  })

  it('discards the draft on the cross and on a press outside, not inside', () => {
    const { onChange } = setup()
    open()
    type('#123456')
    fireEvent.mouseDown(field())
    expect(field().value).toBe('#123456')
    fireEvent.click(parts('btn-half')[0])
    expect(field()).toBeNull()
    open()
    expect(field().value).toBe('#000000')
    type('#123456')
    fireEvent.mouseDown(document.body)
    expect(field()).toBeNull()
    open()
    expect(field().value).toBe('#000000')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('follows a new stored value', () => {
    const { view, onChange } = setup()
    open()
    view.rerender(<ColorPicker value="#abcdef" onChange={onChange} />)
    expect(field().value).toBe('#abcdef')
  })

})

describe('settings ColorPicker alerts', () => {
  it('rates the contrast of the draft against its pair', () => {
    setup({ contrast })
    open()
    expect(part('alert-success').textContent).toBe('Perfect contrast')
    expect(part('tooltip-trigger').dataset.tip).toMatch(/^This color contrasts on secondary color\. Current contrast: \d+ Lc \(perfect\)\. APCA algorithm\.$/)
    expect(part('contrast-example').style.background).toBe('rgb(255, 255, 255)')
    type('#fefefe')
    expect(part('alert-danger').textContent).toBe('Bad contrast')
    type('zzz-not-a-colour')
    expect(part('alert-')).toBeNull()
  })

  it('words the tip the other way round for a foreground pair', () => {
    setup({ contrast: { name: 'primary', isBackground: false, color: '#ffffff' } })
    open()
    expect(part('tooltip-trigger').dataset.tip).toMatch(/^primary color contrasts on this color\./)
    expect(part('contrast-example').style.background).toBe('rgb(0, 0, 0)')
  })

  it('names the dependants', () => {
    setup({ dependants: ['chevron', 'query'] })
    open()
    expect(part('alert-neutral').textContent).toBe('Dependants')
    expect(parts('tooltip-trigger').map(el => el.dataset.tip)).toEqual([
      'Dependants: chevron, query',
      'Changing this color will also affect: chevron, query'
    ])
  })
})
