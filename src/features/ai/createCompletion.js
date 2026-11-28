import { createSseReader, parseErrorBody } from './sse'

// OpenAI-compatible chat completion over SSE (OpenAI, Ollama's /v1 mode, LM Studio, llama.cpp, vLLM).
const REQUEST_DEFAULTS = { stream: true }

function completionUrl(baseURL) {
  // Users paste either `http://host:port` or `http://host:port/v1`, with or without trailing slashes.
  const trimmed = String(baseURL || '').trim().replace(/\/+$/, '')
  return /\/v\d+$/i.test(trimmed) ? `${trimmed}/chat/completions` : `${trimmed}/v1/chat/completions`
}

async function send({ baseURL, model, apiKey }, messages, temperature, signal) {
  // Ollama and LM Studio take no key; sending an empty Bearer header would be rejected by some proxies.
  const headers = { 'Content-Type': 'application/json', ...(apiKey && { Authorization: `Bearer ${apiKey}` }) }
  try {
    return await fetch(completionUrl(baseURL), {
      signal, method: 'POST', headers,
      body: JSON.stringify({ ...REQUEST_DEFAULTS, model, messages, temperature })
    })
  } catch (error) {
    if (signal.aborted) throw error
    throw { code: 'network', message: `Could not reach the AI endpoint (${error?.message || error}).` }
  }
}

// A payload that is not JSON is skipped: proxies inject keep-alive comments and half-sent lines that must not end the answer.
function parseDelta(payload) {
  if (!payload || payload === '[DONE]') return ''
  let parsed
  try { parsed = JSON.parse(payload) } catch { return '' }
  if (parsed.error) throw parseErrorBody(payload, 'error')
  const delta = parsed.choices?.[0]?.delta?.content
  return typeof delta === 'string' ? delta : ''
}

async function readAnswer(body, onText) {
  let answer = ''
  const reader = createSseReader(payload => {
    const delta = parseDelta(payload)
    if (!delta) return
    answer += delta
    onText(answer)
  })
  const stream = body.getReader()
  const decoder = new TextDecoder('utf-8')
  for (;;) {
    const { done, value } = await stream.read()
    if (done) break
    reader.push(decoder.decode(value, { stream: true }))
  }
  reader.push(decoder.decode())
  reader.end()
  return answer
}

// Streams one completion: `onText` receives the full answer so far; resolves with the assistant message. Rejects with
// `{ code, message }` for failures worth showing, or with an AbortError when `signal` fires (callers ignore that one).
export default async function createCompletion({ messages, temperature, config, signal, onText }) {
  const response = await send(config, messages, temperature, signal)
  if (!response.ok) throw parseErrorBody(await response.text(), response.status)
  const content = await readAnswer(response.body, text => { if (!signal.aborted) onText(text) })
  if (!content) throw { code: 'empty', message: 'The AI endpoint returned no readable answer.' }
  return { content, role: 'assistant' }
}
