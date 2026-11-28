import { useEffect, useMemo, useRef, useState } from 'react'
import createCompletion from './createCompletion'
import { resolveProviderConfig, systemMessage } from './providerConfig'

// Older turns are dropped so a long session cannot grow the prompt without bound.
const MAX_HISTORY = 12

const IDLE = { text: '', error: null, waiting: false }

// One completion per `query`, as `{ text, error, waiting }`. A new query (or unmount) aborts the previous stream first, and an
// aborted stream's results are never applied, so answers cannot interleave.
export default function useCompletion(query, ai) {
  const { enabled, provider, baseURL, model, apiKey, temperature, language } = ai
  const { config, missing } = useMemo(
    () => resolveProviderConfig({ provider, baseURL, model, apiKey }),
    [provider, baseURL, model, apiKey]
  )
  const [state, setState] = useState(IDLE)
  const history = useRef([])

  useEffect(() => {
    if (!enabled || !query) return setState(IDLE)
    // Never fire a request without the settings it needs; say what is missing instead.
    if (missing) return setState({ ...IDLE, text: `## AI not configured\n\n${missing}` })

    const controller = new AbortController()
    const turn = { role: 'user', content: query }
    setState({ ...IDLE, waiting: true })
    createCompletion({
      messages: [systemMessage(language), ...history.current, turn],
      temperature, config, signal: controller.signal,
      onText: text => setState({ ...IDLE, text })
    }).then(reply => {
      history.current = [...history.current, turn, reply].slice(-MAX_HISTORY)
      setState(prev => ({ ...prev, waiting: false }))
    }).catch(error => {
      if (controller.signal.aborted) return
      setState(prev => ({ ...IDLE, text: prev.text, error: error?.message || String(error) }))
    })
    return () => controller.abort()
  }, [query, enabled, missing, config, temperature, language])

  return state
}
