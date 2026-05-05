import { lazy, Suspense, useContext, useCallback, useEffect, memo, useRef } from 'react'
import useSuggestions from '../../hooks/useSuggestions'
import useParseQuery from '../../hooks/useParseQuery'
import useRedirect from '../../hooks/useRedirect'
import { SettingsContext } from '../../contexts/Settings'
import { useStateSelector, useUpdate } from '../../contexts/Store'
import Suggestions, { SUGGESTIONS_LISTBOX_ID, suggestionOptionId } from '../Suggestions/Suggestions'
import { allowedModes, activeKeys } from '../../rules'

// AIcompletion drags in react-markdown (~20KB) and the streaming completion
// client; defer the chunk until the user double-taps space to invoke AI.
const AIcompletion = lazy(() => import('../AIcompletion/AIcompletion'))
import googleAutocomplete from '../../autocomplete/googleAutocomplete'
import History from '../../classes/localStorage/history'
import gC from '../../functions/generationUtils/getClasses'
import classes from './QueryField.module.css'
import { useState } from 'react'

const DOUBLE_PRESS_THRESHOLD = 300
const ESC_DOUBLE_PRESS_THRESHOLD = 500

function QueryField () {
  // settings
  const settings = useContext(SettingsContext)

  const searchHistory = settings.general.searchHistory
  const inputFontSize = settings.query.field.fontSize
  const suggestionsFontSize = settings.query.suggestions.fontSize
  const enableCarret = settings.query.field.caret

  const inputRef = useRef(null)
  const escLastPressRef = useRef(-1)

  /* store */
  const mode = useStateSelector(store => store.mode)
  const query = useStateSelector(store => store.query)
  const selectedSuggestion = useStateSelector(store => store.selectedSuggestion)
  const updateStore = useUpdate()
  // ---
  
  // suggestions
  const suggestions = useSuggestions(query, googleAutocomplete)
  
  // parse query
  const [parsedQuery] = useParseQuery(
    selectedSuggestion ? selectedSuggestion.suggestion : query,
    selectedSuggestion ? selectedSuggestion.type : undefined, 
    query)

  // query for AI
  const [aiQuery, setAiQuery] = useState('')

  const redirect = useRedirect()
    
  const handleRedirect = useCallback(() => {
    if (searchHistory)
      // memorise only non generated queries
      if (parsedQuery._type === 'query')
        History.add({ id: parsedQuery.value, type: parsedQuery._type })
  
    redirect(parsedQuery.url, 'main')
  }, [parsedQuery, searchHistory, redirect])

  const handleQueryChange = useCallback(value => {
    if (allowedModes.get('QueryField').has(mode)) {
      //!
      const newValue = value.replace(/\s{2,}/g, ' ')

      if (newValue !== query) {
        setAiQuery('')
        updateStore({ 
          query: newValue, 
          selectedSuggestion: null
        })
      }
    }
  }, [mode, query, updateStore])

  const onKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'Enter':
        if (allowedModes.get('QueryField').has(mode)) {
          // redirecting
          handleRedirect()
          // preventing typing enter in the field
          e.preventDefault()
        }
        break
      case 'Escape':
        // First Esc clears the visible query; a second Esc within
        // ESC_DOUBLE_PRESS_THRESHOLD also drops the AI completion,
        // selected suggestion, and blurs the input for a true reset.
        if (Date.now() - escLastPressRef.current < ESC_DOUBLE_PRESS_THRESHOLD) {
          updateStore({ query: '', selectedSuggestion: null })
          setAiQuery('')
          if (document.activeElement === inputRef.current)
            inputRef.current.blur()
          escLastPressRef.current = -1
        } else {
          updateStore({ query: '', selectedSuggestion: null })
          setAiQuery('')
          escLastPressRef.current = Date.now()
        }
        break
      case 'Tab':
        // Tab / Shift+Tab cycles through suggestions like a standard
        // autocomplete combobox, instead of letting focus escape the field.
        if (allowedModes.get('Suggestions').has(mode) && suggestions.length > 0) {
          const direction = e.shiftKey ? 'prev' : 'next'
          updateStore({ selectedSuggestion: getSuggestion(suggestions, selectedSuggestion, direction) })
          e.preventDefault()
        }
        break
      default:
        if (allowedModes.get('Suggestions').has(mode) && activeKeys.get('Suggestions').has(e.key)) {
          switch (e.key) {
            case 'ArrowUp':
              updateStore({ selectedSuggestion: getSuggestion(suggestions, selectedSuggestion, 'prev') })
              break
            case 'ArrowDown':
              updateStore({ selectedSuggestion: getSuggestion(suggestions, selectedSuggestion, 'next') })
              break
          }
          e.preventDefault()
        }
    }
  }, [mode, updateStore, handleRedirect, suggestions, selectedSuggestion])
  // onKeyDown listener
  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)    
  }, [onKeyDown])

  const spacebarLastPressRef = useRef(-1)
  const onKeyPress = useCallback((e) => {
    if (allowedModes.get('QueryField').has(mode)) {
      if (e.code === 'Space') {
        if (Date.now() - spacebarLastPressRef.current < DOUBLE_PRESS_THRESHOLD)
          setAiQuery(query)

        spacebarLastPressRef.current = Date.now()
      }

      if (document.activeElement !== inputRef.current)
        inputRef.current.focus()
    }
  }, [query, mode])
  // onKeyPress listener
  useEffect(() => {
    window.addEventListener('keypress', onKeyPress)
    return () => window.removeEventListener('keypress', onKeyPress)    
  }, [onKeyPress])

  // Focus grabber: previously this fired on every document click which
  // stole focus from buttons, settings dialogs and the AI completion
  // panel - hostile for keyboard / a11y users. Now we only re-grab focus
  // on mousedown when the click target isn't an interactive element
  // (button, input, textarea, link, summary, [role=button]) or inside
  // any focus-trap container marked with [data-keep-focus] (Settings
  // panel etc). This keeps "type anywhere and it lands in the field"
  // behavior while letting actual UI controls keep keyboard focus.
  useEffect(() => {
    const INTERACTIVE = 'button, input, textarea, select, a[href], summary, [role="button"], [contenteditable="true"], [tabindex]:not([tabindex="-1"]), [data-keep-focus], [data-keep-focus] *'
    const grabFocus = (e) => {
      if (!inputRef.current) return
      if (document.activeElement === inputRef.current) return
      const target = e.target
      if (target && target.nodeType === 1 && target.closest && target.closest(INTERACTIVE))
        return
      inputRef.current.focus()
    }

    document.addEventListener('mousedown', grabFocus)
    return () => document.removeEventListener('mousedown', grabFocus)
  }, [])

  // re-focusing the input inputField to focus on the caret
  useEffect(() => {
    inputRef.current.blur()
    inputRef.current.focus()
  }, [])
  
  // css variables
  const variables = {
    '--font-size': inputFontSize + 'em',
    '--font-size-suggestions': suggestionsFontSize + 'em'
  }

  const expanded = Boolean(parsedQuery.value) && suggestions.length > 0
  const activeOptionIndex = selectedSuggestion ? suggestions.indexOf(selectedSuggestion) : -1
  const activeDescendant = activeOptionIndex >= 0 ? suggestionOptionId(activeOptionIndex) : undefined

  const input = <input
    ref={inputRef}
    value={parsedQuery.value}
    className={gC(classes['field'], !selectedSuggestion && classes['selected'])}
    onChange={e => handleQueryChange(e.target.value)}
    role="combobox"
    aria-label="Search"
    aria-autocomplete="list"
    aria-expanded={expanded}
    aria-controls={SUGGESTIONS_LISTBOX_ID}
    aria-activedescendant={activeDescendant}
    autoComplete="off"
    autoCorrect="off"
    autoCapitalize="off"
    spellCheck={false}
    style={{
      // hide when query is empty
      opacity: parsedQuery.value ? 1 : 0,
      caretColor: enableCarret ? undefined : 'transparent'}}/>

  return (
    <div
      className={classes['container']}
      style={variables}>
        {aiQuery && (
          <Suspense fallback={null}>
            <AIcompletion query={aiQuery} className={classes['ai-completion']} />
          </Suspense>
        )}
        { input }
        { parsedQuery.value && <Suggestions
            queryMode={settings.appearance.style}
            buttonMode={settings.appearance.style}
            suggestions={suggestions}
            selectedSuggestion={selectedSuggestion}
            onRedirect={handleRedirect}
            setSelected={suggestion => updateStore({ selectedSuggestion: suggestion })}/> }
    </div>
  )
}

function getSuggestion(suggestions, selectedSuggestion, option) {
  // current index
  const currentIndex = suggestions.indexOf(selectedSuggestion)

  // new index
  let newIndex = null
  if (typeof option === 'number') {
    newIndex = option
  } else if (option === 'next') {
    newIndex = currentIndex + 1
  } else if (option === 'prev') {
    newIndex = (currentIndex === -1 ? suggestions.length : currentIndex) - 1
  } else {
    throw new Error('unknown option')
  }

  // if the index is out of the range
  if (newIndex < 0 || newIndex >= suggestions.length)
    return null

  // return new suggestion
  return suggestions[newIndex]
}

export default memo(QueryField)