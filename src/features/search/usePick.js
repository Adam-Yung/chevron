import { useCallback } from 'react'
import { useDispatch } from '../../state/UiStore'
import { ui } from '../../state/ui'
import { useIntentsContext } from '../../app/IntentsContext'

/** Mouse handling for suggestions: hover highlights, click selects and submits through the same path as Enter. */
export default function usePick() {
  const dispatch = useDispatch()
  const perform = useIntentsContext()
  const hover = useCallback(item => dispatch(ui.selected({ suggestion: item.suggestion, type: item.type })), [dispatch])
  const pick = useCallback((item, newTab) => {
    dispatch(ui.selected({ suggestion: item.suggestion, type: item.type }))
    perform({ intent: 'submit', newTab })
  }, [dispatch, perform])
  return { pick, hover }
}
