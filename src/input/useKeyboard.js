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

/**
 * The single global keyboard listener. It asks the key router what a key means and hands the intent to `perform`.
 * @param {{ perform: (intent: object) => void, hotkeys: Set<string>, hasSuggestions: () => boolean }} options
 */
export default function useKeyboard({ perform, hotkeys, hasSuggestions }) {
  const store = useUiStore()
  const live = useRef({ perform, hotkeys, hasSuggestions })
  live.current = { perform, hotkeys, hasSuggestions }

  useEffect(() => {
    let shiftDownAt = 0
    let lastSpaceAt = 0
    const setCtrl = on => { if (store.getState().forceEngine !== on) store.dispatch(ui.forceEngineChanged(on)) }

    const route = (input, e) => {
      const ctx = { ...focusContext(), hasSuggestions: live.current.hasSuggestions(), hotkeys: live.current.hotkeys, sinceSpace: Date.now() - lastSpaceAt }
      const intent = routeKey(store.getState(), input, ctx)
      if (!intent) return
      if (intent.prevent && e) e.preventDefault()
      live.current.perform(intent)
    }

    const onKeyDown = e => {
      if (e.key === 'Control') setCtrl(true)
      shiftDownAt = e.key === 'Shift' && !e.repeat ? Date.now() : 0
      if (e.key === 'Shift' || e.isComposing) return
      route(toKeyInput(e), e)
      if (e.key === ' ' && focusContext().inQuery) lastSpaceAt = Date.now()
    }
    const onKeyUp = e => {
      if (e.key === 'Control') setCtrl(false)
      const tapped = e.key === 'Shift' && shiftDownAt && Date.now() - shiftDownAt < SHIFT_TAP_MS && !e.ctrlKey && !e.metaKey && !e.altKey
      shiftDownAt = 0
      if (tapped) route({ type: 'shiftTap' }, null)
    }
    const onBlur = () => {
      shiftDownAt = 0
      setCtrl(false)
    }

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
