import { memo, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import classes from './ColorPicker.module.css'
import shared from '../Picker.module.css'
import PickerPopover from '../PickerPopover'
import { usePopover } from '../usePopover'

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

function editHex(text, setDraft, onChange) {
  const hex = text.startsWith('#') ? text : `#${text}`
  setDraft(hex)
  if (HEX.test(hex)) onChange(hex)
}

// Typed text is a draft: a half-typed "#ff" must not be saved as the colour, so only a complete hex is passed on.
function HexInput({ value, label, onChange }) {
  const [draft, setDraft] = useState(null)

  return (
    <input
      className={classes['hexInput']}
      type="text"
      value={draft ?? value}
      aria-label={`${label || 'Color'} hex value`}
      aria-invalid={draft !== null && !HEX.test(draft)}
      onChange={e => editHex(e.target.value, setDraft, onChange)}
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
    <div className={shared['root']}>
      {label && <span className={shared['label']}>{label}</span>}
      <button
        ref={pop.triggerRef}
        type="button"
        className={shared['trigger']}
        onClick={pop.toggle}
        aria-expanded={pop.open}
        aria-label={`${label || 'Color'}: ${display}. Click to change.`}
      >
        <span className={classes['swatch']} style={{ background: display }} />
        <span className={classes['hexText']}>{display}</span>
      </button>

      {pop.open && (
        <PickerPopover pop={pop} className={classes['popover']}>
          <HexColorPicker style={{ width: '100%' }} color={display} onChange={onChange} />
          <HexInput value={display} label={label} onChange={onChange} />
        </PickerPopover>
      )}
    </div>
  )
}

export default memo(ColorPicker)
