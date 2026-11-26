import { memo } from 'react'
import classes from './MacrosEditor.module.css'
import { TextField } from './Fields'

/**
 * Editor for the global commands list: each entry is a `type` + `trigger` pair such as `{ type: 'search', trigger: '?' }`.
 */
function CommandsTab({ commands, onChange }) {
  const update = (i, key, value) => onChange(commands.map((c, idx) => (idx === i ? { ...c, [key]: value } : c)))

  return (
    <div>
      <p className={classes['hint']}>
        Global commands are matched against macros. Each macro can implement a command in its own <em>Commands</em> section.
      </p>
      {commands.length === 0 && <div className={classes['empty']}>No commands defined.</div>}
      {commands.map((command, i) => (
        <div key={i} className={`${classes['row']} ${classes['globalCommandRow']}`}>
          <TextField label="Type" value={command.type} placeholder="search" onChange={v => update(i, 'type', v)} />
          <TextField label="Trigger" monospace value={command.trigger} placeholder="?" onChange={v => update(i, 'trigger', v)} />
          <button type="button" className={classes['iconBtn']} aria-label={`Delete command ${command.type || i + 1}`} onClick={() => onChange(commands.filter((_, idx) => idx !== i))}>🗑</button>
        </div>
      ))}
      <button type="button" className={classes['addBtn']} onClick={() => onChange([...commands, { type: 'newType', trigger: '' }])}>+ Add command</button>
    </div>
  )
}

export default memo(CommandsTab)
