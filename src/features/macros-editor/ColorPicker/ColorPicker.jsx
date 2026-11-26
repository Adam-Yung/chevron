import { memo, useState } from 'react'
import { createPortal } from 'react-dom'
import { HexColorPicker } from 'react-colorful'
import classes from './ColorPicker.module.css'
import { usePopover } from '../usePopover'

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

// Typed text is a draft: a half-typed "#ff" must not be saved as the colour, so only a complete hex is passed on.
function HexInput({ value, label, onChange }) {
  const [draft, setDraft] = useState(null)

  const edit = text => {
    const hex = text.startsWith('#') ? text : `#${text}`
    setDraft(hex)
    if (HEX.test(hex)) onChange(hex)
  }

  return (
    <input
      className={classes['hexInput']}
      type="text"
      value={draft ?? value}
      aria-label={`${label || 'Color'} hex value`}
      aria-invalid={draft !== null && !HEX.test(draft)}
      onChange={e => edit(e.target.value)}
      onBlur={() => setDraft(null)}
      placeholder="#000000"
      autoFocus
    />
  )
}

function ColorPicker({ label, value, onChange }) {
  const pop = usePopover()
  const display = value || '#000000'

  return (
    <div className={classes['root']}>
      {label && <span className={classes['label']}>{label}</span>}
      <button
        ref={pop.triggerRef}
        type="button"
        className={classes['trigger']}
        onClick={pop.toggle}
        aria-expanded={pop.open}
        aria-label={`${label || 'Color'}: ${display}. Click to change.`}
      >
        <span className={classes['swatch']} style={{ background: display }} />
        <span className={classes['hexText']}>{display}</span>
      </button>

      {pop.open && createPortal(
        <>
          <div className={classes['backdrop']} onPointerDown={pop.onBackdropPointerDown} />
          {/* data-keep-focus: keys typed here must not reach the page-level shortcuts (Shift opens the macros menu). */}
          <div ref={pop.popoverRef} className={classes['popover']} style={pop.style} data-keep-focus="true" onKeyDown={pop.onKeyDown}>
            <HexColorPicker style={{ width: '100%' }} color={display} onChange={onChange} />
            <HexInput value={display} label={label} onChange={onChange} />
          </div>
        </>,
        document.getElementById('root')
      )}
    </div>
  )
}

export default memo(ColorPicker)
