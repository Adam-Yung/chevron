import { memo, useId, useState } from 'react'
import classes from './MacrosEditor.module.css'

const MONO = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }

// A real <label for> so each input has an accessible name (screen readers, and tests that find fields by label).
function Field({ label, children }) {
  const id = useId()
  return (
    <div className={classes['field']}>
      <label htmlFor={id}>{label}</label>
      {children(id)}
    </div>
  )
}

export const TextField = memo(function TextField({ label, value, onChange, placeholder, monospace }) {
  return (
    <Field label={label}>
      {id => (
        <input
          id={id}
          type="text"
          value={value ?? ''}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          style={monospace ? MONO : undefined}
        />
      )}
    </Field>
  )
})

export const NumberField = memo(function NumberField({ label, value, onChange, placeholder, min, max, step }) {
  return (
    <Field label={label}>
      {id => (
        <input
          id={id}
          type="number"
          value={value ?? ''}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        />
      )}
    </Field>
  )
})

export const SelectField = memo(function SelectField({ label, value, options, onChange }) {
  return (
    <Field label={label}>
      {id => (
        <select id={id} value={value ?? ''} onChange={e => onChange(e.target.value)}>
          {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      )}
    </Field>
  )
})

export const CheckboxField = memo(function CheckboxField({ label, checked, onChange }) {
  return (
    <label className={classes['checkboxField']}>
      <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  )
})

/**
 * Edits an object key (engine id, query type, command type). Keys cannot be committed per keystroke: an empty or duplicate
 * key is invalid mid-edit, and applying it would delete the entry or clobber a sibling. So the text is a local draft that is
 * committed on blur or Enter, and reverted if it is not usable.
 */
export const KeyField = memo(function KeyField({ label, value, onCommit, isTaken, monospace }) {
  const [draft, setDraft] = useState(null)
  const shown = draft ?? value
  const trimmed = shown.trim()
  const invalid = draft !== null && (trimmed === '' || (trimmed !== value && isTaken(trimmed)))

  const finish = () => {
    if (draft !== null && !invalid) onCommit(trimmed)
    setDraft(null)
  }

  return (
    <Field label={label}>
      {id => (
        <input
          id={id}
          type="text"
          value={shown}
          aria-invalid={invalid}
          title={invalid ? 'Must be non-empty and not used by another entry' : undefined}
          onChange={e => setDraft(e.target.value)}
          onBlur={finish}
          onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
          style={monospace ? MONO : undefined}
        />
      )}
    </Field>
  )
})
