import { dismissBootShell, takeBootInput } from './bootShell'

function mountShell(text = '') {
  document.body.innerHTML = '<div id="boot-shell"><svg></svg><textarea id="boot-input"></textarea></div>'
  document.getElementById('boot-input').value = text
}

describe('bootShell', () => {
  afterEach(() => { document.body.innerHTML = '' })

  it('hands over the early text once and removes the field', () => {
    mountShell('git')
    expect(takeBootInput()).toBe('git')
    expect(document.getElementById('boot-input')).toBeNull()
    expect(takeBootInput()).toBe('')
  })

  it('keeps the chevron until dismissed', () => {
    mountShell()
    takeBootInput()
    expect(document.getElementById('boot-shell')).not.toBeNull()
    dismissBootShell()
    expect(document.getElementById('boot-shell')).toBeNull()
  })

  it('does nothing without a shell', () => {
    expect(takeBootInput()).toBe('')
    expect(() => dismissBootShell()).not.toThrow()
  })
})
