import { useCallback, useContext, useEffect, useState } from 'react'
import { FiX } from 'react-icons/fi'
import { SettingsContext } from '../../settings/SettingsProvider'
import renderMarkdown from '../../lib/renderMarkdown'
import Icon from './Icon'
import useCompletion from './useCompletion'
import classes from './AIcompletion.module.css'

const stopClick = e => e.stopPropagation()

function useDismissal(query, onClose) {
  const [dismissed, setDismissed] = useState(false)
  // A new query reopens a panel the user closed.
  useEffect(() => setDismissed(false), [query])
  const close = useCallback(() => {
    setDismissed(true)
    onClose?.()
  }, [onClose])
  return { dismissed, close }
}

/** Streamed answer panel for the query field. Renders nothing until there is something to say. */
export default function AIcompletion({ query, className, onClose }) {
  const { query: { AI: ai } } = useContext(SettingsContext)
  const { dismissed, close } = useDismissal(query, onClose)
  // Closing mid-stream must also stop the request, so a dismissed panel is the same as an empty query.
  const { text, error, waiting } = useCompletion(dismissed ? '' : query, ai)

  if (!ai.enabled || dismissed || !(text || error || waiting)) return null

  return <>
    <Icon className={classes['icon']} onClick={stopClick} />
    <div
      className={className}
      data-scrollable
      data-testid="ai-panel"
      onClick={stopClick}
      onKeyDown={e => { if (e.key === 'Escape') close() }}>
      <button type="button" className={classes['close']} onClick={close} aria-label="Close AI answer">
        <FiX size={14} />
      </button>
      {waiting && !text && <div className={classes['thinking']}>thinking…</div>}
      {text && <div className={classes['md-container']}>{renderMarkdown(text)}</div>}
      {error && <div className={classes['error']} role="alert">AI request failed: {error}</div>}
    </div>
  </>
}
