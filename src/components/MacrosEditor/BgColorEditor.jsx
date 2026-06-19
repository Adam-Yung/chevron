import { memo, useCallback } from 'react'
import classes from './MacrosEditor.module.css'
import { SelectField, NumberField } from './Fields'
import ColorPicker from './ColorPicker/ColorPicker'
import { bgPreviewCss, makeSolid, makeGradient } from './colorHelpers'

/**
 * Edits a `bgColor` object: handles both `solid` and `gradient` shapes.
 * Gradients support type (linear/radial), optional angle, an arbitrary
 * list of colors and matching stops. The whole edit surface is plain
 * native form controls — no heavy color libraries.
 */
function BgColorEditor({ value, onChange }) {
  const safe = value && typeof value === 'object' ? value : makeSolid()
  const isGradient = safe.type === 'gradient'

  const setType = useCallback((nextType) => {
    if (nextType === safe.type) return
    onChange(nextType === 'gradient' ? makeGradient(safe) : makeSolid(
      isGradient ? (safe.colors?.[0] || '#888888') : safe.color || '#888888'
    ))
  }, [safe, isGradient, onChange])

  if (!isGradient) {
    return (
      <div>
        <div className={classes['grid']}>
          <SelectField
            label="Background type"
            value="solid"
            options={[
              { value: 'solid', label: 'Solid' },
              { value: 'gradient', label: 'Gradient' }
            ]}
            onChange={setType}
          />
          <ColorPicker
            label="Background color"
            value={safe.color}
            onChange={(color) => onChange({ ...safe, color })}
          />
        </div>
      </div>
    )
  }

  const colors = Array.isArray(safe.colors) ? safe.colors : []
  const stops = Array.isArray(safe.stops) ? safe.stops : null
  const setColors = (next) => onChange({ ...safe, colors: next })
  const setStops = (next) => onChange({ ...safe, stops: next })

  return (
    <div>
      <div className={classes['grid']}>
        <SelectField
          label="Background type"
          value="gradient"
          options={[
            { value: 'solid', label: 'Solid' },
            { value: 'gradient', label: 'Gradient' }
          ]}
          onChange={setType}
        />
        <SelectField
          label="Gradient kind"
          value={safe.gradientType || 'linear'}
          options={[
            { value: 'linear', label: 'Linear' },
            { value: 'radial', label: 'Radial' }
          ]}
          onChange={(gradientType) => onChange({ ...safe, gradientType })}
        />
        {(safe.gradientType || 'linear') === 'linear' && (
          <NumberField
            label="Angle (deg)"
            value={typeof safe.angle === 'number' ? safe.angle : ''}
            onChange={(angle) => onChange({ ...safe, angle: angle === undefined ? undefined : angle })}
            placeholder="45"
            min={0}
            max={360}
            step={1}
          />
        )}
      </div>

      <p className={classes['subhead']}>Color stops</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {colors.map((c, i) => (
          <div key={i} className={classes['cmdRow']} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 28px', gap: 6, alignItems: 'center' }}>
            <ColorPicker
              label={`Color ${i + 1}`}
              value={c}
              onChange={(next) => {
                const arr = [...colors]
                arr[i] = next
                setColors(arr)
              }}
            />
            <NumberField
              label="Stop %"
              value={stops?.[i] ?? ''}
              placeholder="auto"
              min={0}
              max={100}
              step={1}
              onChange={(v) => {
                if (v === undefined && !stops) return
                const arr = stops ? [...stops] : new Array(colors.length).fill(undefined)
                arr[i] = v
                setStops(arr)
              }}
            />
            <button
              type="button"
              className={classes['iconBtn']}
              aria-label={`Remove color ${i + 1}`}
              onClick={() => {
                const arr = colors.filter((_, idx) => idx !== i)
                const stopsArr = stops ? stops.filter((_, idx) => idx !== i) : null
                setColors(arr)
                if (stopsArr) setStops(stopsArr.length ? stopsArr : null)
              }}
            >×</button>
          </div>
        ))}
        <button
          type="button"
          className={classes['addBtn']}
          onClick={() => setColors([...colors, '#888888'])}
        >+ Add color stop</button>
      </div>

      <p className={classes['subhead']} style={{ marginTop: 12 }}>Preview</p>
      <div
        aria-hidden="true"
        style={{
          width: '100%',
          height: 32,
          borderRadius: 6,
          background: bgPreviewCss(safe),
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      />
    </div>
  )
}

export default memo(BgColorEditor)
