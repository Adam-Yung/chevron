import { createContext, useContext, useRef } from 'react'
import { useUi } from '../state/UiStore'
import useSuggestions from './useSuggestions'

const SuggestionsContext = createContext([])
const SuggestionsRefContext = createContext({ current: [] })

/** Computes suggestions once for the whole app: the list renders them, the key handlers step through the same list. */
export default function SearchProvider({ children }) {
  const query = useUi(s => s.query)
  // Leading spaces never change what to suggest; trailing ones do (`new ` should suggest `new york`).
  const suggestions = useSuggestions(query.trimStart())
  const ref = useRef(suggestions)
  ref.current = suggestions
  return (
    <SuggestionsRefContext.Provider value={ref}>
      <SuggestionsContext.Provider value={suggestions}>{children}</SuggestionsContext.Provider>
    </SuggestionsRefContext.Provider>
  )
}

export const useSuggestionList = () => useContext(SuggestionsContext)

/** The latest list without subscribing to it: for event handlers that must not re-render on every keystroke. */
export const useSuggestionsRef = () => useContext(SuggestionsRefContext)
