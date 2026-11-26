import { memo } from 'react'
import classes from './MacrosEditor.module.css'
import { SelectField, NumberField } from './Fields'
import ColorPicker from './ColorPicker/ColorPicker'
import GradientStops from './GradientStops'
import { bgPreviewCss, makeSolid, makeGradient } from './colorHelpers'

const TYPE_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'gradient', label: 'Gradient' }
]
const KIND_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'radial', label: 'Radial' }
]

function switchType(current, nextType) {
  if (nextType === 'gradient') return makeGradient(current)
  const seed = current.type === 'gradient' ? current.colors?.[0] : current.color
  return makeSolid(seed || '#888888')
}

function GradientFields({ value, onChange }) {
  const kind = value.gradientType || 'linear'
  const colors = Array.isArray(value.colors) ? value.colors : []
  const stops = Array.isArray(value.stops) ? value.stops : null
  return (
    <>
      <SelectField label="Gradient kind" value={kind} options={KIND_OPTIONS} onChange={gradientType => onChange({ ...value, gradientType })} />
      {kind === 'linear' && (
        <NumberField
          label="Angle (deg)"
          value={typeof value.angle === 'number' ? value.angle : ''}
          onChange={angle => onChange({ ...value, angle })}
          placeholder="45"
          min={0}
          max={360}
          step={1}
        />
      )}
      <div className={classes['gridFull']}>
        <p className={classes['subhead']}>Color stops</p>
        <GradientStops colors={colors} stops={stops} onChange={change => onChange({ ...value, ...change })} />
        <p className={classes['subhead']}>Preview</p>
        <div className={classes['bgPreview']} aria-hidden="true" style={{ background: bgPreviewCss(value) }} />
      </div>
    </>
  )
}

/**
 * Edits a `bgColor` object, either `{ type: 'solid', color }` or a gradient with kind, optional angle and colour stops. Plain
 * native controls plus the shared ColorPicker; no colour library beyond react-colorful.
 */
function BgColorEditor({ value, onChange }) {
  const safe = value && typeof value === 'object' ? value : makeSolid()
  const isGradient = safe.type === 'gradient'

  return (
    <div className={classes['grid']}>
      <SelectField
        label="Background type"
        value={isGradient ? 'gradient' : 'solid'}
        options={TYPE_OPTIONS}
        onChange={next => onChange(switchType(safe, next))}
      />
      {isGradient
        ? <GradientFields value={safe} onChange={onChange} />
        : <ColorPicker label="Background color" value={safe.color} onChange={color => onChange({ ...safe, color })} />}
    </div>
  )
}

export default memo(BgColorEditor)
