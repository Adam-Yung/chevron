import { memo, useState, useCallback } from 'react'
import classes from './MacrosEditor.module.css'

/**
 * Tiny reusable form fields used by the per-field macros editor.
 * Native HTML elements only — no MUI Joy or react-colorful, so the
 * editor stays fully offline and adds nothing to the bundle.
 */

export const TextField = memo(function TextField({ label, value, onChange, placeholder, monospace }) {
  return (
    <div className={classes['field']}>
      <label>{label}</label>
      <input
        type="text"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={monospace ? { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' } : undefined}
      />
    </div>
  )
})

export const NumberField = memo(function NumberField({ label, value, onChange, placeholder, min, max, step }) {
  return (
    <div className={classes['field']}>
      <label>{label}</label>
      <input
        type="number"
        value={value ?? ''}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = e.target.value
          if (v === '') onChange(undefined)
          else onChange(Number(v))
        }}
      />
    </div>
  )
})

export const SelectField = memo(function SelectField({ label, value, options, onChange }) {
  return (
    <div className={classes['field']}>
      <label>{label}</label>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
})

export const CheckboxField = memo(function CheckboxField({ label, checked, onChange }) {
  return (
    <label className={classes['checkboxField']}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  )
})

/**
 * Chip input: comma / Enter / Tab / blur add the current text as a chip.
 * Backspace on empty input removes the last chip. Click × to remove a
 * specific chip. Duplicates are silently dropped.
 */
export const ChipInput = memo(function ChipInput({ label, values, onChange, placeholder }) {
  const [draft, setDraft] = useState('')

  const commit = useCallback((raw) => {
    const text = raw.trim()
    if (!text) return
    const list = Array.isArray(values) ? values : []
    if (list.includes(text)) {
      setDraft('')
      return
    }
    onChange([...list, text])
    setDraft('')
  }, [values, onChange])

  const remove = useCallback((idx) => {
    const list = Array.isArray(values) ? values : []
    onChange(list.filter((_, i) => i !== idx))
  }, [values, onChange])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      if (draft.trim()) {
        e.preventDefault()
        commit(draft)
      }
    } else if (e.key === 'Backspace' && draft === '' && Array.isArray(values) && values.length > 0) {
      e.preventDefault()
      remove(values.length - 1)
    }
  }, [draft, values, commit, remove])

  const list = Array.isArray(values) ? values : []
  return (
    <div className={classes['field']}>
      <label>{label}</label>
      <div className={classes['chips']}>
        {list.map((v, i) => (
          <span className={classes['chip']} key={`${v}-${i}`}>
            {v}
            <button type="button" aria-label={`Remove ${v}`} onClick={() => remove(i)}>×</button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          placeholder={list.length === 0 ? placeholder : ''}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => draft.trim() && commit(draft)}
        />
      </div>
    </div>
  )
})
