import { useEffect, useRef } from 'react'

function useTransitions(state, options, visibility=true) {
  const _state = String(state)
  const prevState = useRef('null')
  const currentTransition = useRef({
    called: true,
    _func: null,
    set func(value) {
      if (value !== this._func) {
        this._func = value
        this.called = false
      }
    },
    fire() {
      if (!this.called) {
        this._func()
        this.called = true
      }
    }
  })

  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    const opts = optionsRef.current
    if (prevState.current !== _state && opts.transitions[_state]) {
      if (typeof opts.transitions[_state][prevState.current] === 'function') {
        currentTransition.current.func = opts.transitions[_state][prevState.current]
      } else if (typeof opts.transitions[_state].any === 'function') {
        currentTransition.current.func = opts.transitions[_state].any
      }
    }
    
    visibility && currentTransition.current.fire()
    
    prevState.current = _state
  }, [_state, visibility])

  const visibilityRef = useRef(visibility)
  useEffect(() => {
    const prev = visibilityRef.current
    visibilityRef.current = visibility
    if (prev === visibility) return
    const opts = optionsRef.current
    visibility
      ? opts?.visibility?.show?.call()
      : opts?.visibility?.hide?.call()
  }, [visibility])
}

export default useTransitions
