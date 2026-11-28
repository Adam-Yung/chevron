import { memo } from 'react'
import classes from './MacrosEditor.module.css'
import { TextField, KeyField } from './Fields'
import { patchValue, removeKey, renameKey, uniqueKey } from './recordOps'

const NEW_COMMAND = { template: '{@}/{$}', description: '' }

// The per-macro map `{ [type]: { template, description } }`.
function CommandsBlock({ commands, onChange }) {
  const record = commands && typeof commands === 'object' ? commands : {}
  const entries = Object.entries(record)

  return (
    <div className={classes['commandsList']}>
      {entries.length === 0 && <div className={classes['emptyInline']}>No commands.</div>}
      {entries.map(([type, body]) => (
        <div key={type} className={classes['commandRow']}>
          <KeyField label="Type" value={type} isTaken={key => key in record} onCommit={next => onChange(renameKey(record, type, next))} />
          <TextField label="Template" monospace value={body?.template} placeholder="{@}/{$}" onChange={v => onChange(patchValue(record, type, { template: v }))} />
          <TextField label="Description" value={body?.description} onChange={v => onChange(patchValue(record, type, { description: v }))} />
          <button type="button" className={classes['iconBtn']} aria-label={`Remove command ${type}`} onClick={() => onChange(removeKey(record, type))}>×</button>
        </div>
      ))}
      <button type="button" className={classes['addBtn']} onClick={() => onChange({ ...record, [uniqueKey(record, 'newCommand')]: { ...NEW_COMMAND } })}>+ Add command</button>
    </div>
  )
}

export default memo(CommandsBlock)
