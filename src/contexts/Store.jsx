import { useCallback } from 'react'
import createOptimizedContext from './createOptimisedContext'

/*
app modes:
  - default
  - opened
  - searching
*/

class InitialStore {
  constructor() {
    this.mode = 'default',
    this.query = '',
    this.selectedSuggestion = null,
    this.redirected = false,
    // Phase 8a: text the user is typing while macro mode is open. Decoupled
    // from `query` so the macro menu and the search suggestions can never
    // be visible at the same time.
    this.macroFilter = '',
    this.timestamp = Date.now()
  }
}

const {
  Provider,
  useStateSelector,
  useStore,
} = createOptimizedContext()

function StoreProvider({ children }) {
  return (
    <Provider initialState={new InitialStore}>
      {children}
    </Provider>
  )
}

function useUpdate() {
  const store = useStore()

  return useCallback(partialNewState => {
    const state = store.getState()
    if (state.redirected) return
    
    const newState = { ...state, ...partialNewState }
    
    if ('query' in partialNewState)
      newState.mode = partialNewState.query ? 'searching' : 'default'
    if (newState.mode !== 'searching')
      newState.selectedSuggestion = null
    // Phase 8a: leaving `opened` mode (via Esc, Shift toggle, right-click,
    // or any other transition) clears the macro filter so the next time
    // the menu opens it starts blank.
    if (newState.mode !== 'opened')
      newState.macroFilter = ''

    store.update(newState)
  }, [store])
}

function useReset() {
  const store = useStore()
  return () => store.update({ ...(new InitialStore) })
}

export { StoreProvider, useStateSelector, useUpdate, useReset }