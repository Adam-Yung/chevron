import classes from './MacrosEditor.module.css'

const MAX_LISTED = 6

function MessageList({ messages, className, role }) {
  if (messages.length === 0) return null
  const shown = messages.slice(0, MAX_LISTED)
  const hidden = messages.length - shown.length
  return (
    <ul className={className} role={role}>
      {shown.map(message => <li key={message}>{message}</li>)}
      {hidden > 0 && <li>…and {hidden} more.</li>}
    </ul>
  )
}

// Errors block saving, warnings do not. The status line is never empty so the layout does not jump.
export default function EditorStatus({ validation, status }) {
  return (
    <div className={classes['statusArea']}>
      <MessageList messages={validation.errors} className={classes['problems']} role="alert" />
      <MessageList messages={validation.warnings} className={classes['warnings']} />
      <div className={`${classes['status']} ${classes[status.kind] || ''}`} role="status">
        {status.message || ' '}
      </div>
    </div>
  )
}
