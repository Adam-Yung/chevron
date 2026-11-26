import { memo } from 'react'
import classes from './MacrosEditor.module.css'
import { TextField, KeyField } from './Fields'
import { removeKey, renameKey, replaceValue, uniqueKey } from './recordOps'

const NEW_COMMAND = { template: '{@}/{$}', description: '' }

/**
 * The per-macro `commands` map: `{ [type]: { template, description } }`, e.g. `search` or `go`. The type is the key, so it
 * is edited with KeyField (commit on blur) rather than per keystroke.
 */
function CommandsBlock({ commands, onChange }) {
  const record = commands && typeof commands === 'object' ? commands : {}
  const entries = Object.entries(record)
  const patch = (type, body, change) => onChange(replaceValue(record, type, { ...(body || {}), ...change }))
  const add = () => onChange({ ...record, [uniqueKey(record, 'newCommand')]: { ...NEW_COMMAND } })

  return (
    <div className={classes['commandsList']}>
      {entries.length === 0 && <div className={classes['emptyInline']}>No commands.</div>}
      {entries.map(([type, body]) => (
        <div key={type} className={classes['commandRow']}>
          <KeyField label="Type" value={type} isTaken={key => key in record} onCommit={next => onChange(renameKey(record, type, next))} />
          <TextField label="Template" monospace value={body?.template} placeholder="{@}/{$}" onChange={v => patch(type, body, { template: v })} />
          <TextField label="Description" value={body?.description} onChange={v => patch(type, body, { description: v })} />
          <button type="button" className={classes['iconBtn']} aria-label={`Remove command ${type}`} onClick={() => onChange(removeKey(record, type))}>×</button>
        </div>
      ))}
      <button type="button" className={classes['addBtn']} onClick={add}>+ Add command</button>
    </div>
  )
}

export default memo(CommandsBlock)
