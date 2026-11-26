import { memo, useState } from 'react'
import classes from './MacrosEditor.module.css'

const COMMIT_KEYS = ['Enter', ',', 'Tab']

/**
 * Chips for the macro triggers: comma, Enter, Tab or blur turn the text into a chip; Backspace on empty text removes the
 * last chip. Duplicates are dropped. Tab only commits when there is text, so it never traps keyboard focus.
 */
function ChipInput({ label, values, onChange, placeholder }) {
  const [draft, setDraft] = useState('')
  const list = Array.isArray(values) ? values : []

  const commit = raw => {
    const added = raw.split(',').map(part => part.trim()).filter(part => part && !list.includes(part))
    setDraft('')
    if (added.length) onChange([...new Set([...list, ...added])])
  }

  const removeAt = index => onChange(list.filter((_, i) => i !== index))

  const handleKeyDown = e => {
    if (COMMIT_KEYS.includes(e.key) && draft.trim()) {
      e.preventDefault()
      commit(draft)
      return
    }
    if (e.key === 'Backspace' && draft === '' && list.length > 0) {
      e.preventDefault()
      removeAt(list.length - 1)
    }
  }

  return (
    <div className={classes['field']}>
      <span className={classes['fieldLabel']}>{label}</span>
      <div className={classes['chips']}>
        {list.map((value, i) => (
          <span className={classes['chip']} key={`${value}-${i}`}>
            {value}
            <button type="button" aria-label={`Remove trigger ${value}`} onClick={() => removeAt(i)}>×</button>
          </span>
        ))}
        <input
          type="text"
          aria-label={label}
          value={draft}
          placeholder={list.length === 0 ? placeholder : ''}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => commit(draft)}
        />
      </div>
    </div>
  )
}

export default memo(ChipInput)
