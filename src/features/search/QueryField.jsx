import { lazy, memo, Suspense, useCallback, useContext, useEffect } from 'react'
import { SettingsContext } from '../../settings/SettingsProvider'
import { useDispatch, useUi } from '../../state/UiStore'
import { ui } from '../../state/ui'
import { useSuggestionList } from '../../search/SearchProvider'
import { sameSuggestion } from '../../search/suggestions'
import Suggestions, { SUGGESTIONS_LISTBOX_ID, suggestionOptionId } from './Suggestions'
import useAdaptiveFontSize from './useAdaptiveFontSize'
import usePick from './usePick'
import { QUERY_FIELD_ID } from './queryFieldId'
import classes from './QueryField.module.css'

const AIcompletion = lazy(() => import('../ai/AIcompletion'))

function useAutoFocus() {
  useEffect(() => {
    // On touch screens focusing at load would pop the on-screen keyboard unasked.
    if (window.matchMedia?.('(pointer: coarse)').matches) return
    document.getElementById(QUERY_FIELD_ID)?.focus({ preventScroll: true })
  }, [])
}

function AiPanel() {
  const prompt = useUi(s => s.aiPrompt)
  const dispatch = useDispatch()
  const close = useCallback(() => dispatch(ui.aiClosed()), [dispatch])
  if (!prompt) return null
  return (
    <Suspense fallback={null}>
      <AIcompletion query={prompt} className={classes['ai-completion']} onClose={close} />
    </Suspense>
  )
}

/** The search field: the always-focused target of typing, with the suggestion list and the AI panel around it. */
function QueryField() {
  const settings = useContext(SettingsContext)
  const query = useUi(s => s.query)
  const selection = useUi(s => s.selection)
  const leaving = useUi(s => Boolean(s.leaving))
  const dispatch = useDispatch()
  const items = useSuggestionList()
  const [boxRef, fontSize] = useAdaptiveFontSize(query, settings.query.field.fontSize)
  const { pick, hover } = usePick()
  useAutoFocus()

  const activeIndex = selection ? items.findIndex(s => sameSuggestion(s, selection)) : -1
  const open = Boolean(query) && items.length > 0

  return (
    <div ref={boxRef} className={classes.container} data-leaving={leaving || undefined}
      style={{ '--font-size': fontSize + 'em', '--font-size-suggestions': settings.query.suggestions.fontSize + 'em' }}>
      <AiPanel />
      <textarea id={QUERY_FIELD_ID} className={classes.field} value={query} rows={1} placeholder=' '
        onChange={e => dispatch(ui.typed(e.target.value))}
        role='combobox' aria-label='Search' aria-autocomplete='list' aria-expanded={open} aria-controls={SUGGESTIONS_LISTBOX_ID}
        aria-activedescendant={activeIndex >= 0 ? suggestionOptionId(activeIndex) : undefined}
        autoComplete='off' autoCorrect='off' autoCapitalize='off' spellCheck={false}
        style={{ caretColor: settings.query.field.caret ? undefined : 'transparent' }} />
      {open && <Suggestions items={items} selection={selection} query={query} onPick={pick} onHover={hover} />}
    </div>
  )
}

export default memo(QueryField)
