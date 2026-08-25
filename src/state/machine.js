/**
 * Minimal finite state machine for Chevron app modes.
 *
 * States: default, opened, searching, redirected
 * Events are dispatched, guards are checked, actions are run,
 * and subscribers are notified of transitions.
 */

const TRANSITIONS = {
  default: {
    SHIFT_PRESS:  { target: 'opened' },
    QUERY_TYPED:  { target: 'searching' },
    CONTEXT_MENU: { target: 'opened' },
    SWIPE_UP:     { target: 'opened' },
    SCROLL_UP:    { target: 'opened' },
  },
  searching: {
    QUERY_CLEARED: { target: 'default' },
    SHIFT_PRESS:   { target: 'default' },
    REDIRECT:      { target: 'redirected' },
  },
  opened: {
    SHIFT_PRESS:  { target: 'default' },
    ESC_PRESS:    { target: 'default' },
    SCROLL_DOWN:  { target: 'default' },
    SWIPE_DOWN:   { target: 'default' },
    CONTEXT_MENU: { target: 'default' },
  },
  redirected: {
    PAGE_RETURN: { target: 'default' },
  }
}

class StateMachine {
  constructor(initial = 'default') {
    this._state = initial
    this._listeners = new Set()
    this._guards = new Map()
    this._transitioning = false
  }

  get state() {
    return this._state
  }

  /**
   * Register a guard function for a specific state+event combo.
   * Guard returns false to block the transition.
   */
  guard(state, event, fn) {
    this._guards.set(`${state}:${event}`, fn)
    return this
  }

  /**
   * Subscribe to state transitions.
   * Callback receives { from, to, event }.
   */
  subscribe(fn) {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }

  /**
   * Dispatch an event. Returns true if a transition occurred.
   */
  send(event, payload) {
    const transitions = TRANSITIONS[this._state]
    if (!transitions) return false

    const transition = transitions[event]
    if (!transition) return false

    // Check guard
    const guardKey = `${this._state}:${event}`
    const guardFn = this._guards.get(guardKey)
    if (guardFn && !guardFn(payload)) return false

    // Perform transition
    const from = this._state
    const to = transition.target
    this._state = to
    this._transitioning = true

    // Notify subscribers
    for (const fn of this._listeners) {
      fn({ from, to, event, payload })
    }

    this._transitioning = false
    return true
  }

  /**
   * Check if an event would produce a transition from current state.
   */
  can(event) {
    const transitions = TRANSITIONS[this._state]
    return !!(transitions && transitions[event])
  }

  /**
   * Force state (for initialization/reset). Notifies subscribers.
   */
  reset(state = 'default') {
    const from = this._state
    this._state = state
    for (const fn of this._listeners) {
      fn({ from, to: state, event: 'RESET' })
    }
  }
}

const machine = new StateMachine('default')
export default machine
export { TRANSITIONS }
