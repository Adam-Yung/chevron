/**
 * A minimal external store: one state value, a reducer, and subscribers.
 * @template S, A
 * @param {(state: S, action: A) => S} reducer
 * @param {S} initialState
 */
export function createStore(reducer, initialState) {
  let state = initialState
  const listeners = new Set()

  return {
    getState: () => state,
    dispatch(action) {
      const next = reducer(state, action)
      if (next === state) return
      state = next
      for (const listener of listeners) listener()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
  }
}
