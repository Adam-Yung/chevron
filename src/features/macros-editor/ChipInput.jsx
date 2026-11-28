import { memo, useState } from 'react'
import classes from './MacrosEditor.module.css'
import { removeAt } from './listOps'

const COMMIT_KEYS = ['Enter', ',', 'Tab']

function commitChips(raw, { list, setDraft, onChange }) {
  const added = raw.split(',').map(part => part.trim()).filter(part => part && !list.includes(part))
  setDraft('')
  if (added.length) onChange([...new Set([...list, ...added])])
}

// Tab only commits when there is text, so it never traps keyboard focus.
function handleChipKey(event, draft, chips) {
  if (COMMIT_KEYS.includes(event.key) && draft.trim()) {
    event.preventDefault()
    commitChips(draft, chips)
    return
  }
  if (event.key === 'Backspace' && draft === '' && chips.list.length > 0) {
    event.preventDefault()
    chips.onChange(removeAt(chips.list, chips.list.length - 1))
  }
}

function ChipInput({ label, values, onChange, placeholder }) {
  const [draft, setDraft] = useState('')
  const list = Array.isArray(values) ? values : []

  const chips = { list, setDraft, onChange }

  return (
    <div className={classes['field']}>
      <span className={classes['fieldLabel']}>{label}</span>
      <div className={classes['chips']}>
        {list.map((value, i) => (
          <span className={classes['chip']} key={`${value}-${i}`}>
            {value}
            <button type="button" aria-label={`Remove trigger ${value}`} onClick={() => onChange(removeAt(list, i))}>×</button>
          </span>
        ))}
        <input
          type="text"
          aria-label={label}
          value={draft}
          placeholder={list.length === 0 ? placeholder : ''}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => handleChipKey(e, draft, chips)}
          onBlur={() => commitChips(draft, chips)}
        />
      </div>
    </div>
  )
}

export default memo(ChipInput)
