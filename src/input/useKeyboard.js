import { useEffect, useRef } from 'react'
import { useUiStore } from '../state/UiStore'
import { ui } from '../state/ui'
import { routeKey } from './keyRouter'
import { QUERY_FIELD_ID } from '../features/search/queryFieldId'

// Shift pressed and released on its own, quickly, toggles the sites menu. Acting on keydown instead opened the menu whenever
// someone started typing a capital letter.
const SHIFT_TAP_MS = 400

const CONTROL = 'button, a[href], [role="button"], summary'

function focusContext() {
  const active = document.activeElement
  const inQuery = active?.id === QUERY_FIELD_ID
  const editable = active && !inQuery && (active.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName))
  const onControl = Boolean(active && !inQuery && active.matches?.(CONTROL))
  return { inQuery, onControl, inPanel: Boolean(editable || active?.closest?.('[data-keep-focus]')) }
}

const toKeyInput = e => ({
  type: 'keydown', key: e.key, code: e.code, shift: e.shiftKey, ctrl: e.ctrlKey, meta: e.metaKey, alt: e.altKey, repeat: e.repeat
})

function setForceEngine(store, on) {
  if (store.getState().forceEngine !== on) store.dispatch(ui.forceEngineChanged(on))
}

// A `session` is what one set of listeners knows: the store, the latest options (`live`) and the last Shift and Space presses.
function route({ store, live, lastSpaceAt }, input, e) {
  const ctx = { ...focusContext(), hasSuggestions: live.current.hasSuggestions(), hotkeys: live.current.hotkeys, sinceSpace: Date.now() - lastSpaceAt }
  const intent = routeKey(store.getState(), input, ctx)
  if (!intent) return
  if (intent.prevent && e) e.preventDefault()
  live.current.perform(intent)
}

const keyDownHandler = session => e => {
  if (e.key === 'Control') setForceEngine(session.store, true)
  session.shiftDownAt = e.key === 'Shift' && !e.repeat ? Date.now() : 0
  if (e.key === 'Shift' || e.isComposing) return
  route(session, toKeyInput(e), e)
  if (e.key === ' ' && focusContext().inQuery) session.lastSpaceAt = Date.now()
}

const keyUpHandler = session => e => {
  if (e.key === 'Control') setForceEngine(session.store, false)
  const { shiftDownAt } = session
  const tapped = e.key === 'Shift' && shiftDownAt && Date.now() - shiftDownAt < SHIFT_TAP_MS && !e.ctrlKey && !e.metaKey && !e.altKey
  session.shiftDownAt = 0
  if (tapped) route(session, { type: 'shiftTap' }, null)
}

const blurHandler = session => () => {
  session.shiftDownAt = 0
  setForceEngine(session.store, false)
}

// The single global keyboard listener. It asks the key router what a key means and hands the intent to `perform`.
/** @param {{ perform: (intent: object) => void, hotkeys: Set<string>, hasSuggestions: () => boolean }} options */
export default function useKeyboard({ perform, hotkeys, hasSuggestions }) {
  const store = useUiStore()
  const live = useRef({ perform, hotkeys, hasSuggestions })
  live.current = { perform, hotkeys, hasSuggestions }

  useEffect(() => {
    const session = { store, live, shiftDownAt: 0, lastSpaceAt: 0 }
    const onKeyDown = keyDownHandler(session)
    const onKeyUp = keyUpHandler(session)
    const onBlur = blurHandler(session)

    // Capture phase: the router decides before any panel or field sees the key, and panels opt out with [data-keep-focus].
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp, true)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
      window.removeEventListener('blur', onBlur)
    }
  }, [store])
}
