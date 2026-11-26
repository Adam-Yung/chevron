import { useEffect, useRef } from 'react'
import { useUiStore } from '../state/UiStore'
import { ui } from '../state/ui'
import { QUERY_FIELD_ID } from '../features/search/queryFieldId'

const INTERACTIVE = 'button, input, textarea, select, a[href], summary, [role="button"], [contenteditable="true"], [tabindex]:not([tabindex="-1"]), [data-keep-focus]'
const WHEEL = { threshold: 120, cooldownMs: 900, decayMs: 450 }

function useFocusKeeper(store) {
  useEffect(() => {
    // A click on empty space puts the caret back in the field, so typing always works; clicks on controls keep their focus.
    const onMouseDown = e => {
      const { view, overlay } = store.getState()
      if (overlay || e.target?.closest?.(INTERACTIVE)) return
      // A click on empty space around the open menu closes it, like clicking outside any popup.
      if (view === 'macros') {
        if (e.button === 0 && !e.target?.closest?.('.splide, [data-macros-top]')) store.dispatch(ui.macrosClosed())
        return
      }
      const field = document.getElementById(QUERY_FIELD_ID)
      if (field && document.activeElement !== field) {
        e.preventDefault()
        field.focus()
      }
    }
    const onContextMenu = e => {
      const { view, overlay } = store.getState()
      const inField = Boolean(e.target?.closest?.(`#${QUERY_FIELD_ID}`))
      // On a control, or on the field while it holds text, the browser's own menu (copy, paste) is what the user wants.
      if (overlay || (inField && view === 'search') || (!inField && e.target?.closest?.(INTERACTIVE))) return
      e.preventDefault()
      store.dispatch(ui.macrosToggled(false))
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('contextmenu', onContextMenu)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('contextmenu', onContextMenu)
    }
  }, [store])
}

// Scroll up opens the sites menu, scroll down closes it. Deltas accumulate so a resting finger on a trackpad does nothing, and a
// cooldown stops one long fling from toggling twice.
function useWheelToggle(store, enabledRef) {
  useEffect(() => {
    let acc = 0
    let lastAction = 0
    let decay = 0
    const onWheel = e => {
      const { view, overlay } = store.getState()
      if (!enabledRef.current || overlay || e.target?.closest?.('[data-keep-focus], [data-scrollable]')) return
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      clearTimeout(decay)
      decay = setTimeout(() => { acc = 0 }, WHEEL.decayMs)
      acc += e.deltaY
      if (Date.now() - lastAction < WHEEL.cooldownMs) return
      const open = acc < -WHEEL.threshold && view === 'idle'
      const close = acc > WHEEL.threshold && view === 'macros'
      if (!open && !close) return
      store.dispatch(open ? ui.macrosToggled(false) : ui.macrosClosed())
      acc = 0
      lastAction = Date.now()
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      clearTimeout(decay)
    }
  }, [store, enabledRef])
}

/** Mouse and trackpad: focus keeping, right-click toggle, scroll toggle. */
export default function usePointerInput({ wheelEnabled }) {
  const store = useUiStore()
  const wheelRef = useRef(wheelEnabled)
  wheelRef.current = wheelEnabled
  useFocusKeeper(store)
  useWheelToggle(store, wheelRef)
}
