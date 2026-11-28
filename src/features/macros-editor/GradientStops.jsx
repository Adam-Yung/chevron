import classes from './MacrosEditor.module.css'
import { NumberField } from './Fields'
import ColorPicker from './ColorPicker/ColorPicker'
import { removeAt, replaceAt } from './listOps'

const NEW_STOP_COLOR = '#888888'

function setStop({ colors, stops, onChange }, i, stop) {
  if (stop === undefined && !stops) return
  const base = stops || new Array(colors.length).fill(undefined)
  onChange({ colors, stops: replaceAt(base, i, stop) })
}

function removeColor({ colors, stops, onChange }, i) {
  const nextStops = stops ? removeAt(stops, i) : null
  onChange({ colors: removeAt(colors, i), stops: nextStops?.length ? nextStops : null })
}

// `stops` stays null until the user sets one, so untouched gradients keep their automatic spacing.
export default function GradientStops({ colors, stops, onChange }) {
  const gradient = { colors, stops, onChange }

  return (
    <div className={classes['stopList']}>
      {colors.map((color, i) => (
        <div key={i} className={classes['stopRow']}>
          <ColorPicker label={`Color ${i + 1}`} value={color} onChange={next => onChange({ colors: replaceAt(colors, i, next), stops })} />
          <NumberField label="Stop %" value={stops?.[i] ?? ''} placeholder="auto" min={0} max={100} step={1} onChange={v => setStop(gradient, i, v)} />
          <button type="button" className={classes['iconBtn']} aria-label={`Remove color ${i + 1}`} onClick={() => removeColor(gradient, i)}>×</button>
        </div>
      ))}
      <button type="button" className={classes['addBtn']} onClick={() => onChange({ colors: [...colors, NEW_STOP_COLOR], stops })}>+ Add color stop</button>
    </div>
  )
}
