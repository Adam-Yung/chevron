import { lazy, memo, Suspense, useCallback, useContext, useLayoutEffect } from 'react'
import { SettingsContext } from '../../settings/SettingsProvider'
import { useDispatch, useUi } from '../../state/UiStore'
import { ui } from '../../state/ui'
import { useSuggestionList } from '../../search/SearchProvider'
import { takeBootInput } from '../../app/bootShell'
import { sameSuggestion } from '../../search/suggestions'
import Suggestions, { SUGGESTIONS_LISTBOX_ID, suggestionOptionId } from './Suggestions'
import useAdaptiveFontSize from './useAdaptiveFontSize'
import usePick from './usePick'
import { getQueryField, QUERY_FIELD_ID } from './queryFieldId'
import classes from './QueryField.module.css'

const AIcompletion = lazy(() => import('../ai/AIcompletion'))

// A layout effect: the shell's field leaves the DOM in this same task, so focus moves straight to the real field and no key typed in
// between is lost.
function useBootHandoff(dispatch) {
  useLayoutEffect(() => {
    const field = getQueryField()
    const early = takeBootInput()
    if (early) dispatch(ui.typed(early))
    // On touch screens focusing at load would pop the on-screen keyboard unasked.
    if (window.matchMedia?.('(pointer: coarse)').matches) return
    field?.focus({ preventScroll: true })
  }, [dispatch])
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
  useBootHandoff(dispatch)

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
