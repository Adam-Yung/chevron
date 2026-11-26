import { createContext, useContext, useState, useSyncExternalStore } from 'react'
import { createStore } from './store'
import { initialUiState, uiReducer } from './ui'

const UiStoreContext = createContext(null)

export function createUiStore(initial = initialUiState) {
  return createStore(uiReducer, initial)
}

export function UiStoreProvider({ store, children }) {
  const [owned] = useState(() => store ?? createUiStore())
  return <UiStoreContext.Provider value={owned}>{children}</UiStoreContext.Provider>
}

export function useUiStore() {
  const store = useContext(UiStoreContext)
  if (!store) throw new Error('useUiStore must be used inside <UiStoreProvider>')
  return store
}

/**
 * Subscribe to one slice of UI state. Return a primitive or a stable reference: a new object every call re-renders on every
 * dispatch.
 */
export function useUi(selector) {
  const store = useUiStore()
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()))
}

export function useDispatch() {
  return useUiStore().dispatch
}
