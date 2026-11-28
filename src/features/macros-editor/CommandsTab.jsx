import { memo } from 'react'
import classes from './MacrosEditor.module.css'
import { TextField } from './Fields'
import { patchAt, removeAt } from './listOps'

// The global commands list, e.g. `{ type: 'search', trigger: '?' }`.
function CommandsTab({ commands, onChange }) {
  return (
    <div>
      <p className={classes['hint']}>
        Global commands are matched against macros. Each macro can implement a command in its own <em>Commands</em> section.
      </p>
      {commands.length === 0 && <div className={classes['empty']}>No commands defined.</div>}
      {commands.map((command, i) => (
        <div key={i} className={`${classes['row']} ${classes['globalCommandRow']}`}>
          <TextField label="Type" value={command.type} placeholder="search" onChange={type => onChange(patchAt(commands, i, { type }))} />
          <TextField label="Trigger" monospace value={command.trigger} placeholder="?" onChange={trigger => onChange(patchAt(commands, i, { trigger }))} />
          <button type="button" className={classes['iconBtn']} aria-label={`Delete command ${command.type || i + 1}`} onClick={() => onChange(removeAt(commands, i))}>🗑</button>
        </div>
      ))}
      <button type="button" className={classes['addBtn']} onClick={() => onChange([...commands, { type: 'newType', trigger: '' }])}>+ Add command</button>
    </div>
  )
}

export default memo(CommandsTab)
