import machine from './machine'

/**
 * Single event dispatcher for the Chevron app.
 * Replaces the 4 competing keydown listeners with one unified handler.
 *
 * Components import `dispatch` and call it with event names.
 * The keyboard handler is registered once at app init.
 */

// Callbacks for side effects that need to happen on certain transitions
const transitionHandlers = new Map()

/**
 * Register a handler for a specific transition (from → to).
 * Used by components to react to state changes.
 */
export function onTransition(from, to, handler) {
  const key = `${from}→${to}`
  if (!transitionHandlers.has(key)) transitionHandlers.set(key, new Set())
  transitionHandlers.get(key).add(handler)
  return () => transitionHandlers.get(key).delete(handler)
}

// Wire up transition handler dispatching
machine.subscribe(({ from, to, event, payload }) => {
  const key = `${from}→${to}`
  const handlers = transitionHandlers.get(key)
  if (handlers) {
    for (const h of handlers) h({ from, to, event, payload })
  }
  // Wildcard handlers (any → to)
  const wildKey = `*→${to}`
  const wildHandlers = transitionHandlers.get(wildKey)
  if (wildHandlers) {
    for (const h of wildHandlers) h({ from, to, event, payload })
  }
})

/**
 * Dispatch an event to the state machine.
 */
export function dispatch(event, payload) {
  return machine.send(event, payload)
}

/**
 * Get current state.
 */
export function getState() {
  return machine.state
}

/**
 * Install the global keyboard handler.
 * Call once at app initialization.
 */
export function installKeyboardHandler() {
  document.addEventListener('keydown', handleKeyDown)
  window.addEventListener('blur', handleBlur)
  return () => {
    document.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('blur', handleBlur)
  }
}

function handleKeyDown(e) {
  // Shift toggle (no repeat, no other modifiers)
  if (e.key === 'Shift' && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) {
    if (machine.send('SHIFT_PRESS')) {
      e.preventDefault()
    }
    return
  }

  // Escape
  if (e.key === 'Escape') {
    if (machine.send('ESC_PRESS')) {
      e.preventDefault()
    }
    return
  }
}

function handleBlur() {
  // Safety: if window loses focus during opened state,
  // we don't auto-close (user might Cmd+Tab and come back)
  // The FSM stays in its current state.
}

export default { dispatch, getState, installKeyboardHandler, onTransition }
