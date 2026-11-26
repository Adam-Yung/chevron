import classes from './MacrosEditor.module.css'
import { NumberField } from './Fields'
import ColorPicker from './ColorPicker/ColorPicker'

const NEW_STOP_COLOR = '#888888'

function replaceAt(list, index, value) {
  return list.map((item, i) => (i === index ? value : item))
}

/**
 * The colour list of a gradient with an optional stop percentage per colour. `stops` stays null until the user sets one, so
 * untouched gradients keep their automatic spacing.
 */
export default function GradientStops({ colors, stops, onChange }) {
  const setColor = (i, color) => onChange({ colors: replaceAt(colors, i, color), stops })

  const setStop = (i, stop) => {
    if (stop === undefined && !stops) return
    const base = stops || new Array(colors.length).fill(undefined)
    onChange({ colors, stops: replaceAt(base, i, stop) })
  }

  const remove = i => {
    const nextStops = stops ? stops.filter((_, idx) => idx !== i) : null
    onChange({ colors: colors.filter((_, idx) => idx !== i), stops: nextStops?.length ? nextStops : null })
  }

  return (
    <div className={classes['stopList']}>
      {colors.map((color, i) => (
        <div key={i} className={classes['stopRow']}>
          <ColorPicker label={`Color ${i + 1}`} value={color} onChange={next => setColor(i, next)} />
          <NumberField label="Stop %" value={stops?.[i] ?? ''} placeholder="auto" min={0} max={100} step={1} onChange={v => setStop(i, v)} />
          <button type="button" className={classes['iconBtn']} aria-label={`Remove color ${i + 1}`} onClick={() => remove(i)}>×</button>
        </div>
      ))}
      <button type="button" className={classes['addBtn']} onClick={() => onChange({ colors: [...colors, NEW_STOP_COLOR], stops })}>+ Add color stop</button>
    </div>
  )
}
