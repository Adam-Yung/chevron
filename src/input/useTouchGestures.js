import { useEffect, useRef } from 'react'
import { useUiStore } from '../state/UiStore'
import { ui } from '../state/ui'
import { classifySwipe } from './swipe'
import { emitMacroPage } from './gestureEvents'
import { QUERY_FIELD_ID } from '../features/search/queryFieldId'

const OWN_SCROLL = '[data-keep-focus], [data-scrollable]'

function actFor(direction, view) {
  const acts = {
    idle: { up: 'toggle', left: 'focus' },
    macros: { down: 'close', left: 'next', right: 'previous' },
    search: { right: 'clear' }
  }
  return acts[view]?.[direction] ?? null
}

/** Single-finger swipes. Focusing the field happens inside the touch handler so the browser lets the keyboard open. */
export default function useTouchGestures(enabled) {
  const store = useUiStore()
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  useEffect(() => {
    let start = null
    const field = () => document.getElementById(QUERY_FIELD_ID)
    const run = {
      toggle: () => store.dispatch(ui.macrosToggled(false)),
      close: () => store.dispatch(ui.macrosClosed()),
      next: () => emitMacroPage('+'),
      previous: () => emitMacroPage('-'),
      focus: () => field()?.focus(),
      clear: () => { store.dispatch(ui.typed('')); field()?.blur() }
    }
    const onStart = e => {
      const inOwnScroller = e.target?.closest?.(OWN_SCROLL)
      start = enabledRef.current && e.touches.length === 1 && !inOwnScroller
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now() } : null
    }
    const onEnd = e => {
      if (!start) return
      const t = e.changedTouches[0]
      const direction = classifySwipe({ dx: t.clientX - start.x, dy: t.clientY - start.y, dt: performance.now() - start.t })
      start = null
      const act = direction && actFor(direction, store.getState().view)
      if (act && !store.getState().overlay) run[act]()
    }
    const onCancel = () => { start = null }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    window.addEventListener('touchcancel', onCancel, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onCancel)
    }
  }, [store])
}
