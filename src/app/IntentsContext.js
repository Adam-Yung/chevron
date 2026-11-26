import { createContext, useContext } from 'react'

/** `perform(intent)` from useIntents, for components that trigger the same actions as keys (suggestion clicks). */
export const IntentsContext = createContext(() => {})
export const useIntentsContext = () => useContext(IntentsContext)
